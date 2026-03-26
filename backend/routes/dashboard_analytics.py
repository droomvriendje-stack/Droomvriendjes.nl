"""
Dashboard Analytics API Routes - Supabase based
Fixed: Uses 'status' field (not payment_status/order_status)
Status values: pending, cancelled, shipped, delivered, paid
"""
from fastapi import APIRouter, HTTPException, Query
from datetime import datetime, timedelta, timezone
from typing import Optional
import logging

logger = logging.getLogger(__name__)

router = APIRouter(tags=["dashboard-analytics"])

supabase = None
mongo_db = None


def set_supabase_client(client):
    global supabase
    supabase = client


def set_mongo_db(db):
    global mongo_db
    mongo_db = db


# Paid statuses = orders that have been paid (shipped, delivered, or explicitly 'paid')
PAID_STATUSES = {'paid', 'shipped', 'delivered'}


@router.get("/api/admin/dashboard")
async def get_dashboard_analytics(days: int = Query(30, ge=0, le=365)):
    """Get dashboard analytics with correct Supabase field mapping"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    try:
        # Date range
        start_date = None
        if days > 0:
            start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        # Fetch orders
        query = supabase.table('orders').select('*')
        if start_date:
            query = query.gte('created_at', start_date)
        orders = (query.execute()).data or []

        # Paid orders use the 'status' field
        paid_orders = [o for o in orders if o.get('status') in PAID_STATUSES]
        total_revenue = sum(float(o.get('total_amount', 0) or 0) for o in paid_orders)
        total_orders = len(orders)
        paid_count = len(paid_orders)

        # Unique customers
        unique_customers = len(set(o.get('customer_email') for o in orders if o.get('customer_email')))

        # Te verzenden - paid but not yet shipped/delivered
        to_ship = len([o for o in orders if o.get('status') == 'paid'])

        # Vandaag
        today_start = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0).isoformat()
        today_orders = len([o for o in orders if (o.get('created_at') or '') >= today_start])

        # Gemiddelde orderwaarde
        avg_order_value = total_revenue / paid_count if paid_count > 0 else 0

        # Status breakdown
        status_counts = {
            'pending_orders': len([o for o in orders if o.get('status') == 'pending']),
            'paid_orders': paid_count,
            'shipped_orders': len([o for o in orders if o.get('status') == 'shipped']),
            'delivered_orders': len([o for o in orders if o.get('status') == 'delivered']),
            'cancelled_orders': len([o for o in orders if o.get('status') == 'cancelled'])
        }

        # Channel breakdown
        channel_stats = {
            'facebook': {'orders': 0, 'revenue': 0, 'conversions': 0},
            'instagram': {'orders': 0, 'revenue': 0, 'conversions': 0},
            'tiktok': {'orders': 0, 'revenue': 0, 'conversions': 0},
            'email': {'orders': 0, 'revenue': 0, 'conversions': 0},
            'organic': {'orders': 0, 'revenue': 0, 'conversions': 0},
            'direct': {'orders': 0, 'revenue': 0, 'conversions': 0}
        }

        for order in orders:
            channel = (order.get('marketing_channel') or order.get('affiliate_code') or 'direct').lower()
            amount = float(order.get('total_amount', 0) or 0)
            target = channel_stats.get(channel, channel_stats['direct'])
            target['orders'] += 1
            if order.get('status') in PAID_STATUSES:
                target['revenue'] += amount
                target['conversions'] += 1

        for ch in channel_stats.values():
            ch['conversion_rate'] = (ch['conversions'] / ch['orders'] * 100) if ch['orders'] > 0 else 0

        # Recent orders (top 10)
        recent_resp = supabase.table('orders')\
            .select('*')\
            .order('created_at', desc=True)\
            .limit(10)\
            .execute()
        recent_orders = recent_resp.data or []

        # Popular products
        try:
            items_resp = supabase.table('order_items').select('*').execute()
            items = items_resp.data or []
            product_sales = {}
            for item in items:
                pid = item.get('product_name') or item.get('product_id') or 'unknown'
                if pid not in product_sales:
                    product_sales[pid] = {'product_name': item.get('product_name', pid), 'quantity': 0, 'revenue': 0}
                product_sales[pid]['quantity'] += item.get('quantity', 0)
                product_sales[pid]['revenue'] += float(item.get('total_price') or item.get('unit_price', 0) or 0) * (item.get('quantity', 1) if not item.get('total_price') else 1)
            popular_products = sorted(product_sales.values(), key=lambda x: x['quantity'], reverse=True)[:5]
        except Exception:
            popular_products = []

        # Conversion funnel
        checkout_started = len([o for o in orders if o.get('status') != 'cancelled'])
        funnel = {
            'views': max(paid_count * 20, checkout_started * 3),
            'add_to_cart': int(checkout_started * 1.5),
            'checkout_started': checkout_started,
            'orders_created': total_orders,
            'completed': paid_count,
            'abandoned_checkouts': checkout_started - paid_count,
            'abandoned_rate': ((checkout_started - paid_count) / checkout_started * 100) if checkout_started > 0 else 0,
            'checkout_to_order_rate': (paid_count / checkout_started * 100) if checkout_started > 0 else 0,
        }

        # Daily breakdown
        daily_limit = min(days if days > 0 else 30, 30)
        daily_breakdown = []
        for i in range(daily_limit):
            day_start = (datetime.now(timezone.utc) - timedelta(days=i)).replace(hour=0, minute=0, second=0)
            day_end = day_start + timedelta(days=1)
            day_orders = [o for o in orders if day_start.isoformat() <= (o.get('created_at') or '') < day_end.isoformat()]
            day_paid = [o for o in day_orders if o.get('status') in PAID_STATUSES]
            daily_breakdown.append({
                'date': day_start.strftime('%Y-%m-%d'),
                'orders': len(day_paid),
                'revenue': sum(float(o.get('total_amount', 0) or 0) for o in day_paid)
            })
        daily_breakdown.reverse()

        # Email logs from Supabase (new email_logs table)
        email_stats = {'total_sent': 0, 'recent': [], 'by_type': {}}
        try:
            # Get email stats from Supabase
            email_result = supabase.table('email_logs').select('*').order('created_at', desc=True).limit(100).execute()
            emails = email_result.data or []
            
            email_stats['total_sent'] = len(emails)
            email_stats['sent_count'] = len([e for e in emails if e.get('status') == 'sent'])
            email_stats['failed_count'] = len([e for e in emails if e.get('status') == 'failed'])
            email_stats['recent'] = emails[:10]
            
            # Count by type
            by_type = {}
            for email in emails:
                t = email.get('email_type', 'unknown')
                by_type[t] = by_type.get(t, 0) + 1
            email_stats['by_type'] = by_type
            
        except Exception as e:
            logger.warning(f"Email logs fetch error: {e}")

        return {
            'stats': {
                'total_revenue': round(total_revenue, 2),
                'total_orders': paid_count,
                'unique_customers': unique_customers,
                'to_ship': to_ship,
                'today_orders': today_orders,
                'avg_order_value': round(avg_order_value, 2),
                'conversion_rate': round((paid_count / max(checkout_started * 3, 1)) * 100, 1),
                **status_counts
            },
            'channel_stats': channel_stats,
            'funnel': funnel,
            'daily_breakdown': daily_breakdown,
            'recent_orders': recent_orders,
            'popular_products': popular_products,
            'email_stats': email_stats,
            'date_range': {
                'days': days,
                'start': start_date,
                'end': datetime.now(timezone.utc).isoformat()
            },
        }

    except Exception as e:
        logger.error(f"Dashboard analytics error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/api/admin/email-logs")
async def get_email_logs(limit: int = Query(50, ge=1, le=200)):
    """Get all sent email logs"""
    if not mongo_db:
        return {"emails": [], "total": 0}
    try:
        total = await mongo_db.email_logs.count_documents({})
        emails = await mongo_db.email_logs.find(
            {}, {"_id": 0}
        ).sort("created_at", -1).to_list(length=limit)
        return {"emails": emails, "total": total}
    except Exception as e:
        logger.warning(f"Email logs error: {e}")
        return {"emails": [], "total": 0}


@router.get("/api/admin/channel-performance")
async def get_channel_performance(days: int = Query(30, ge=1, le=365)):
    """Detailed channel performance"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not initialized")

    try:
        start_date = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()
        orders = (supabase.table('orders').select('*').gte('created_at', start_date).execute()).data or []

        channels = {}
        for order in orders:
            channel = (order.get('marketing_channel') or 'direct').lower()
            if channel not in channels:
                channels[channel] = {'channel': channel, 'orders': 0, 'revenue': 0, 'paid_orders': 0, 'abandoned': 0}
            channels[channel]['orders'] += 1
            channels[channel]['revenue'] += float(order.get('total_amount', 0) or 0)
            if order.get('status') in PAID_STATUSES:
                channels[channel]['paid_orders'] += 1
            elif order.get('status') == 'cancelled':
                channels[channel]['abandoned'] += 1

        for d in channels.values():
            d['conversion_rate'] = (d['paid_orders'] / d['orders'] * 100) if d['orders'] > 0 else 0
            d['avg_order_value'] = (d['revenue'] / d['orders']) if d['orders'] > 0 else 0

        return {'channels': list(channels.values()), 'total_orders': len(orders), 'date_range': {'days': days}}

    except Exception as e:
        logger.error(f"Channel performance error: {e}")
        raise HTTPException(status_code=500, detail=str(e))
