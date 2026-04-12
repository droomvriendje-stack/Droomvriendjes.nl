"""
Orders & Payments API Routes - Supabase PostgreSQL based
"""
from fastapi import APIRouter, Depends, Header, HTTPException, Request, status
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import uuid
import os
import smtplib
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from mollie.api.client import Client as MollieClient

logger = logging.getLogger(__name__)

router = APIRouter(tags=["orders"])


# ---- API key dependency ----
from security import validate_api_key


async def verify_api_key(x_api_key: str = Header(None)):
    """Require a valid X-Api-Key header on write endpoints"""
    if not x_api_key or not validate_api_key(x_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return x_api_key

# Supabase client - will be set by main app
supabase = None

# SMTP config
SMTP_HOST = os.environ.get('SMTP_HOST', 'smtp.transip.email')
SMTP_PORT = int(os.environ.get('SMTP_PORT', 465))
SMTP_USER = os.environ.get('SMTP_USER', '')
SMTP_PASSWORD = os.environ.get('SMTP_PASSWORD', '')
SMTP_FROM = os.environ.get('SMTP_FROM', 'info@droomvriendjes.nl')
OWNER_EMAIL = "info@droomvriendjes.nl"


def _send_email(to_email: str, subject: str, html_content: str, text_content: str):
    """Send email via TransIP SMTP"""
    try:
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = f'Droomvriendjes <{SMTP_FROM}>'
        msg['To'] = to_email
        msg.attach(MIMEText(text_content, 'plain'))
        msg.attach(MIMEText(html_content, 'html'))
        context = ssl.create_default_context()
        with smtplib.SMTP_SSL(SMTP_HOST, SMTP_PORT, context=context) as server:
            server.login(SMTP_USER, SMTP_PASSWORD)
            server.sendmail(SMTP_FROM, to_email, msg.as_string())
        logger.info(f"Email sent to {to_email}: {subject}")
        return True
    except Exception as e:
        logger.error(f"Email failed to {to_email}: {e}")
        return False


def _send_order_confirmation(order_data: dict, items: list):
    """Send order confirmation to customer after successful payment"""
    customer_email = order_data.get('customer_email')
    if not customer_email:
        return False
    customer_name = order_data.get('customer_name', 'Klant')
    order_number = order_data.get('order_number', order_data.get('id', '')[:8].upper())
    total_amount = order_data.get('total_amount', 0)

    items_html = ""
    for item in items:
        items_html += f"""
        <tr>
            <td style="padding:10px;border-bottom:1px solid #eee;">{item.get('product_name','Product')}</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:center;">{item.get('quantity',1)}x</td>
            <td style="padding:10px;border-bottom:1px solid #eee;text-align:right;">EUR {item.get('unit_price', item.get('price',0)):.2f}</td>
        </tr>"""

    html = f"""<!DOCTYPE html><html><head><meta charset="utf-8"></head>
    <body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;background:#f9f9f9;">
    <div style="background:#fff;border-radius:10px;padding:30px;box-shadow:0 2px 10px rgba(0,0,0,0.1);">
        <div style="text-align:center;margin-bottom:30px;">
            <h1 style="color:#8B7355;margin:0;">Droomvriendjes</h1>
        </div>
        <h2 style="color:#333;">Bedankt voor je bestelling, {customer_name}!</h2>
        <p style="color:#666;line-height:1.6;">Je bestelling is succesvol ontvangen en wordt zo snel mogelijk verwerkt.</p>
        <div style="background:#fdf8f3;border-radius:8px;padding:15px;margin:20px 0;">
            <p style="margin:0;color:#8B7355;"><strong>Bestelnummer:</strong> {order_number}</p>
        </div>
        <table style="width:100%;border-collapse:collapse;margin:20px 0;">
            <thead><tr style="background:#8B7355;color:white;">
                <th style="padding:10px;text-align:left;">Product</th>
                <th style="padding:10px;text-align:center;">Aantal</th>
                <th style="padding:10px;text-align:right;">Prijs</th>
            </tr></thead>
            <tbody>{items_html}</tbody>
            <tfoot><tr>
                <td colspan="2" style="padding:15px;font-weight:bold;font-size:18px;">Totaal</td>
                <td style="padding:15px;font-weight:bold;font-size:18px;text-align:right;color:#8B7355;">EUR {total_amount:.2f}</td>
            </tr></tfoot>
        </table>
        <div style="background:#e8f5e9;border-radius:8px;padding:15px;margin:20px 0;">
            <p style="margin:0;color:#2e7d32;">Gratis verzending - Voor 23:00 besteld, morgen in huis!</p>
        </div>
        <div style="border-top:1px solid #eee;margin-top:30px;padding-top:20px;text-align:center;color:#999;">
            <p>Vragen? Mail naar <a href="mailto:info@droomvriendjes.nl" style="color:#8B7355;">info@droomvriendjes.nl</a></p>
        </div>
    </div></body></html>"""

    text = f"Bedankt voor je bestelling, {customer_name}! Bestelnummer: {order_number}. Totaal: EUR {total_amount:.2f}"
    return _send_email(customer_email, f"Bedankt voor je bestelling! #{order_number}", html, text)


def _send_order_notification(order_data: dict, items: list, event_type: str):
    """Send order notification to shop owner"""
    order_number = order_data.get('order_number', order_data.get('id', '')[:8].upper())
    customer_email = order_data.get('customer_email', '')
    customer_name = order_data.get('customer_name', '')
    total = order_data.get('total_amount', 0)

    titles = {
        'order_placed': ('Nieuwe Bestelling', '#3b82f6'),
        'payment_success': ('Betaling Geslaagd', '#10b981'),
        'payment_failed': ('Betaling Mislukt', '#ef4444'),
    }
    title, color = titles.get(event_type, titles['order_placed'])

    html = f"""<html><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
    <div style="background:{color};padding:15px;border-radius:8px 8px 0 0;"><h2 style="color:white;margin:0;">{title}</h2></div>
    <div style="padding:20px;border:1px solid #eee;">
        <p><strong>Order:</strong> {order_number}</p>
        <p><strong>Klant:</strong> {customer_name} ({customer_email})</p>
        <p><strong>Totaal:</strong> EUR {total:.2f}</p>
    </div></body></html>"""
    text = f"{title}: {order_number} - {customer_name} - EUR {total:.2f}"
    return _send_email(OWNER_EMAIL, f"{title} - #{order_number}", html, text)

def set_supabase_client(client):
    """Set the Supabase client"""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for orders route")


# Pydantic models
class OrderItem(BaseModel):
    product_id: str
    product_name: str
    quantity: int
    price: float


class OrderCreate(BaseModel):
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None
    customer_address: str
    customer_city: str
    customer_zipcode: str
    customer_comment: Optional[str] = None
    items: List[OrderItem]
    subtotal: Optional[float] = None
    discount: Optional[float] = None
    total_amount: float
    discount_code: Optional[str] = None
    affiliate_code: Optional[str] = None


class PaymentCreate(BaseModel):
    order_id: str
    payment_method: str = "ideal"


def get_mollie_client():
    """Get configured Mollie client"""
    api_key = os.environ.get('MOLLIE_API_KEY', '')
    if not api_key:
        raise ValueError("MOLLIE_API_KEY not configured")
    client = MollieClient()
    client.set_api_key(api_key)
    return client


def get_frontend_url():
    """Get frontend URL for redirects"""
    return os.environ.get('FRONTEND_URL', 'https://droomvriendjes.nl')


def get_api_url():
    """Get API URL for webhooks"""
    return os.environ.get('API_URL', 'https://droomvriendjes.nl')


@router.post("/orders", dependencies=[Depends(verify_api_key)])
async def create_order(order: OrderCreate):
    """Create a new order in Supabase"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        order_id = str(uuid.uuid4())
        
        # Create order in Supabase
        order_data = {
            "id": order_id,
            "order_number": f"DV-{datetime.now().strftime('%Y%m%d')}-{order_id[:8].upper()}",
            "customer_email": order.customer_email,
            "customer_name": order.customer_name,
            "customer_phone": order.customer_phone or "",
            "shipping_address": order.customer_address,
            "shipping_city": order.customer_city,
            "shipping_zipcode": order.customer_zipcode,
            "customer_notes": order.customer_comment or "",
            "subtotal": order.subtotal or order.total_amount,
            "discount_amount": order.discount or 0,
            "total_amount": order.total_amount,
            "currency": "EUR",
            "status": "pending",
            "discount_code": order.discount_code,
            "affiliate_code": order.affiliate_code,
        }
        
        # Insert order
        result = supabase.table("orders").insert(order_data).execute()
        
        if not result.data:
            raise HTTPException(status_code=500, detail="Failed to create order")
        
        # Insert order items
        for item in order.items:
            item_data = {
                "id": str(uuid.uuid4()),
                "order_id": order_id,
                "product_name": item.product_name,
                "product_sku": item.product_id,
                "quantity": item.quantity,
                "unit_price": item.price,
                "total_price": item.price * item.quantity,
            }
            supabase.table("order_items").insert(item_data).execute()
        
        logger.info(f"Order created in Supabase: {order_id}")
        
        # Send notification email to owner
        try:
            _send_order_notification(order_data, [{"product_name": i.product_name, "quantity": i.quantity, "unit_price": i.price} for i in order.items], 'order_placed')
        except Exception as email_err:
            logger.error(f"Failed to send order notification: {email_err}")
        
        return {"order_id": order_id, "status": "pending"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating order: {e}")
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")


@router.post("/payments/create")
async def create_payment(payment: PaymentCreate):
    """Create a Mollie payment for an order"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Get order from Supabase
        result = supabase.table("orders").select("*").eq("id", payment.order_id).limit(1).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = result.data[0]
        
        # Initialize Mollie client
        mollie_client = get_mollie_client()
        
        # Build URLs
        frontend_url = get_frontend_url()
        api_url = get_api_url()
        redirect_url = f"{frontend_url}/betaling-resultaat/{payment.order_id}"
        webhook_url = f"{api_url}/api/webhook/mollie"
        cancel_url = f"{frontend_url}/checkout"
        
        logger.info(f"Creating payment for order {payment.order_id}")
        logger.info(f"Redirect URL: {redirect_url}")
        logger.info(f"Webhook URL: {webhook_url}")
        
        # Base payment data
        payment_data = {
            'amount': {
                'currency': 'EUR',
                'value': f"{order['total_amount']:.2f}"
            },
            'description': f"Droomvriendjes Bestelling #{payment.order_id[:8].upper()}",
            'redirectUrl': redirect_url,
            'cancelUrl': cancel_url,
            'webhookUrl': webhook_url,
            'method': payment.payment_method,
            'metadata': {
                'order_id': payment.order_id,
                'customer_email': order['customer_email'],
                'discount_code': order.get('discount_code', ''),
                'discount_amount': str(order.get('discount_amount', 0))
            }
        }
        
        # Add billing address for Klarna/iDEAL in3
        if payment.payment_method in ['klarna', 'klarnapaylater', 'klarnasliceit', 'in3', 'ideal_in3']:
            name_parts = order.get('customer_name', '').split(' ', 1)
            given_name = name_parts[0] if name_parts else ''
            family_name = name_parts[1] if len(name_parts) > 1 else name_parts[0]
            
            payment_data['billingAddress'] = {
                'givenName': given_name,
                'familyName': family_name,
                'email': order.get('customer_email', ''),
                'streetAndNumber': order.get('shipping_address', ''),
                'postalCode': order.get('shipping_zipcode', ''),
                'city': order.get('shipping_city', ''),
                'country': 'NL'
            }
            payment_data['shippingAddress'] = payment_data['billingAddress'].copy()
        
        # Create Mollie payment
        mollie_payment = mollie_client.payments.create(payment_data)
        
        # Update order with payment info
        supabase.table("orders").update({
            "mollie_payment_id": mollie_payment.id,
            "payment_method": payment.payment_method,
        }).eq("id", payment.order_id).execute()
        
        # Create payment record
        payment_record = {
            "id": str(uuid.uuid4()),
            "order_id": payment.order_id,
            "mollie_payment_id": mollie_payment.id,
            "status": "pending",
            "amount": order['total_amount'],
            "currency": "EUR",
            "method": payment.payment_method,
        }
        supabase.table("payments").insert(payment_record).execute()
        
        logger.info(f"Payment created: {mollie_payment.id}")
        
        return {
            "payment_id": mollie_payment.id,
            "checkout_url": mollie_payment.checkout_url,
            "status": mollie_payment.status
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment creation error: {e}")
        raise HTTPException(status_code=500, detail=f"Payment creation failed: {str(e)}")


@router.post("/webhook/mollie")
async def mollie_webhook(request: Request):
    """Handle Mollie webhook notifications"""
    if supabase is None:
        return {"status": "error", "message": "Database not configured"}
    
    try:
        form_data = await request.form()
        payment_id = form_data.get("id")
        
        if not payment_id:
            logger.warning("Webhook received without payment ID")
            return {"status": "error", "message": "Missing payment ID"}
        
        logger.info(f"Webhook received for payment: {payment_id}")
        
        # Get Mollie payment status
        mollie_client = get_mollie_client()
        mollie_payment = mollie_client.payments.get(payment_id)
        
        # Find payment record in Supabase
        result = supabase.table("payments").select("*").eq("mollie_payment_id", payment_id).limit(1).execute()
        
        if not result.data:
            logger.warning(f"Payment not found: {payment_id}")
            return {"status": "error", "message": "Payment not found"}
        
        db_payment = result.data[0]
        order_id = db_payment["order_id"]
        
        # Map Mollie status to order status
        status_map = {
            'paid': 'paid',
            'pending': 'pending',
            'open': 'pending',
            'canceled': 'cancelled',
            'expired': 'cancelled',
            'failed': 'cancelled',
        }
        
        new_status = status_map.get(mollie_payment.status, 'pending')
        
        # Update payment status
        supabase.table("payments").update({
            "status": new_status,
        }).eq("mollie_payment_id", payment_id).execute()
        
        # Update order status
        supabase.table("orders").update({
            "status": new_status,
        }).eq("id", order_id).execute()
        
        logger.info(f"Payment {payment_id} status updated to: {new_status}")
        
        # Send emails on payment status change
        try:
            order_result = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
            items_result = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
            if order_result.data:
                order = order_result.data[0]
                items = items_result.data or []
                if new_status == 'paid':
                    _send_order_confirmation(order, items)
                    _send_order_notification(order, items, 'payment_success')
                elif new_status == 'cancelled':
                    _send_order_notification(order, items, 'payment_failed')
        except Exception as email_err:
            logger.error(f"Failed to send payment emails: {email_err}")
        
        return {"status": "ok"}
        
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        return {"status": "error", "message": str(e)}


@router.get("/orders/{order_id}")
async def get_order(order_id: str):
    """Get order by ID"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("orders").select("*").eq("id", order_id).limit(1).execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Order not found")
        
        order = result.data[0]
        
        # Get order items
        items_result = supabase.table("order_items").select("*").eq("order_id", order_id).execute()
        order['items'] = items_result.data or []
        
        # Format response
        return {
            "id": order.get("id"),
            "order_number": order.get("order_number"),
            "customer_email": order.get("customer_email"),
            "customer_name": order.get("customer_name"),
            "total_amount": order.get("total_amount"),
            "status": order.get("status"),
            "mollie_payment_id": order.get("mollie_payment_id"),
            "items": order.get("items", []),
            "created_at": order.get("created_at"),
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting order: {e}")
        raise HTTPException(status_code=500, detail=str(e))
