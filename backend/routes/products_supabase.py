"""
Products API Routes - Supabase PostgreSQL based product catalog
"""
from fastapi import APIRouter, Depends, Header, HTTPException, UploadFile, File, Form, status
from typing import List, Optional
from datetime import datetime, timezone
from pydantic import BaseModel
import logging
import uuid
import os
import json

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/products", tags=["products"])

# Supabase client - will be set by main app
supabase = None


# ---- API key dependency ----
from backend.security import validate_api_key


async def verify_api_key(x_api_key: str = Header(None)):
    """Require a valid X-Api-Key header on write endpoints"""
    if not x_api_key or not validate_api_key(x_api_key):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key",
        )
    return x_api_key

def set_supabase_client(client):
    """Set the Supabase client"""
    global supabase
    supabase = client
    logger.info("✅ Supabase client set for products route")


# Pydantic models
class ProductCreate(BaseModel):
    name: str
    short_name: Optional[str] = None
    price: float
    original_price: Optional[float] = None
    description: Optional[str] = None
    features: List[str] = []
    benefits: List[str] = []
    sku: str
    badge: Optional[str] = None
    in_stock: bool = True
    stock: int = 100
    age_range: str = "Vanaf 0 maanden"
    warranty: str = "30 dagen slaapgarantie"
    item_category: str = "Knuffels"
    item_category2: Optional[str] = None
    item_category3: Optional[str] = None
    item_variant: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    short_name: Optional[str] = None
    price: Optional[float] = None
    original_price: Optional[float] = None
    description: Optional[str] = None
    features: Optional[List[str]] = None
    benefits: Optional[List[str]] = None
    sku: Optional[str] = None
    badge: Optional[str] = None
    in_stock: Optional[bool] = None
    stock: Optional[int] = None
    age_range: Optional[str] = None
    warranty: Optional[str] = None
    image: Optional[str] = None
    gallery: Optional[List] = None
    macro_image: Optional[str] = None
    dimensions_image: Optional[str] = None


def format_product_response(product: dict) -> dict:
    """Format Supabase product to match frontend expectations (camelCase)"""
    if not product:
        return None
    
    # Parse JSON fields
    features = product.get("features", "[]")
    if isinstance(features, str):
        try:
            features = json.loads(features)
        except:
            features = []
    
    benefits = product.get("benefits", "[]")
    if isinstance(benefits, str):
        try:
            benefits = json.loads(benefits)
        except:
            benefits = []
    
    gallery = product.get("gallery", "[]")
    if isinstance(gallery, str):
        try:
            gallery = json.loads(gallery)
        except:
            gallery = []
    
    custom_sections = product.get("custom_sections", "[]")
    if isinstance(custom_sections, str):
        try:
            custom_sections = json.loads(custom_sections)
        except:
            custom_sections = []
    
    # Parse specs JSON
    specs = product.get("specs", "{}")
    if isinstance(specs, str):
        try:
            specs = json.loads(specs)
        except:
            specs = {}
    
    # Parse quickFeatures JSON
    quick_features = product.get("quick_features", "[]")
    if isinstance(quick_features, str):
        try:
            quick_features = json.loads(quick_features)
        except:
            quick_features = []
    
    return {
        "id": product.get("id"),
        "name": product.get("name"),
        "shortName": product.get("short_name"),
        "slug": product.get("slug"),
        "price": product.get("price"),
        "originalPrice": product.get("original_price"),
        "image": product.get("image"),
        "macroImage": product.get("macro_image"),
        "dimensionsImage": product.get("dimensions_image"),
        "description": product.get("description"),
        "shortDescription": product.get("short_description"),
        "features": features,
        "benefits": benefits,
        "gallery": gallery,
        "customSections": custom_sections,
        "specs": specs,
        "quickFeatures": quick_features,
        "rating": product.get("rating", 0),
        "reviews": product.get("review_count", 0),
        "badge": product.get("badge"),
        "inStock": product.get("in_stock", True),
        "stock": product.get("stock", 0),
        "ageRange": product.get("age_range"),
        "warranty": product.get("warranty"),
        "sku": product.get("sku"),
        "itemId": product.get("item_id"),
        "itemCategory": product.get("item_category"),
        "itemCategory2": product.get("item_category2"),
        "itemCategory3": product.get("item_category3"),
        "itemVariant": product.get("item_variant"),
        "createdAt": product.get("created_at"),
        "updatedAt": product.get("updated_at"),
    }


@router.get("")
async def get_all_products():
    """Get all products from Supabase"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("products").select("*").limit(10).execute()
        products = [format_product_response(p) for p in result.data]
        return products
    except Exception as e:
        logger.error(f"Error fetching products: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}")
async def get_product(product_id: str):
    """Get a single product by ID"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return format_product_response(result.data[0])
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("", dependencies=[Depends(verify_api_key)])
async def create_product(product: ProductCreate):
    """Create a new product"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        product_data = {
            "id": str(uuid.uuid4()),
            "name": product.name,
            "short_name": product.short_name,
            "price": product.price,
            "original_price": product.original_price,
            "description": product.description,
            "features": json.dumps(product.features),
            "benefits": json.dumps(product.benefits),
            "gallery": "[]",
            "sku": product.sku,
            "badge": product.badge,
            "in_stock": product.in_stock,
            "stock": product.stock,
            "age_range": product.age_range,
            "warranty": product.warranty,
            "item_category": product.item_category,
            "item_category2": product.item_category2,
            "item_category3": product.item_category3,
            "item_variant": product.item_variant,
        }
        
        # Remove None values
        product_data = {k: v for k, v in product_data.items() if v is not None}
        
        result = supabase.table("products").insert(product_data).execute()
        
        if result.data and len(result.data) > 0:
            return format_product_response(result.data[0])
        
        raise HTTPException(status_code=500, detail="Failed to create product")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating product: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}", dependencies=[Depends(verify_api_key)])
async def update_product(product_id: str, updates: dict):
    """Update a product"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        # Map camelCase to snake_case
        field_mapping = {
            "shortName": "short_name",
            "originalPrice": "original_price",
            "macroImage": "macro_image",
            "dimensionsImage": "dimensions_image",
            "shortDescription": "short_description",
            "customSections": "custom_sections",
            "inStock": "in_stock",
            "ageRange": "age_range",
            "itemCategory": "item_category",
            "itemCategory2": "item_category2",
            "itemCategory3": "item_category3",
            "itemVariant": "item_variant",
            "itemId": "item_id",
            "reviewCount": "review_count",
            "reviews": "review_count",
            "quickFeatures": "quick_features",
        }
        
        # Convert updates to snake_case
        db_updates = {}
        for key, value in updates.items():
            if key in ["id", "_id"]:
                continue
            
            db_key = field_mapping.get(key, key)
            
            # Convert lists and dicts to JSON
            if isinstance(value, (list, dict)):
                db_updates[db_key] = json.dumps(value)
            else:
                db_updates[db_key] = value
        
        if not db_updates:
            raise HTTPException(status_code=400, detail="No valid updates provided")
        
        result = supabase.table("products").update(db_updates).eq("id", product_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return format_product_response(result.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}", dependencies=[Depends(verify_api_key)])
async def delete_product(product_id: str):
    """Delete a product"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("products").delete().eq("id", product_id).execute()
        
        if not result.data or len(result.data) == 0:
            raise HTTPException(status_code=404, detail="Product not found")
        
        return {"message": "Product deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.put("/{product_id}/advanced")
async def update_product_advanced(product_id: str, updates: dict):
    """Update product with advanced customizations"""
    return await update_product(product_id, updates)


@router.get("/{product_id}/advanced")
async def get_product_advanced(product_id: str):
    """Get product with all advanced customizations"""
    return await get_product(product_id)


# ============== PRODUCT IMAGE INFO & OVERRIDES ==============

@router.get("/{product_id}/image-info")
async def get_product_image_info(product_id: str):
    """Get image info for the product editor"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
        if not result.data:
            raise HTTPException(status_code=404, detail="Product niet gevonden")
        
        product = result.data[0]
        gallery = product.get("gallery", "[]")
        if isinstance(gallery, str):
            try:
                gallery = json.loads(gallery)
            except:
                gallery = []
        
        return {
            "default": {
                "image": product.get("image"),
                "gallery": gallery
            },
            "active": {
                "image": product.get("image"),
                "gallery": gallery
            },
            "overrides": {
                "image": None,
                "gallery": []
            },
            "has_overrides": False
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting image info for {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{product_id}/set-image-override")
async def set_image_override(product_id: str, image: str = None, gallery: str = None):
    """Set image override (uses GET for CRA proxy compatibility)"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    try:
        updates = {}
        if image is not None and image.strip():
            updates["image"] = image.strip()
        
        if updates:
            supabase.table("products").update(updates).eq("id", product_id).execute()
        
        return {"success": True}
    except Exception as e:
        logger.error(f"Error setting image override for {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/{product_id}/image-override")
async def delete_image_override(product_id: str):
    """Clear image overrides"""
    return {"success": True, "message": "Overrides cleared"}


# ============== PRODUCT IMAGE UPLOAD (Supabase Storage) ==============

SUPABASE_BUCKET = "product-images"

def get_product_folder(product_name: str) -> str:
    """Generate safe folder name from product name (ASCII only)"""
    safe_name = product_name.lower().strip()
    safe_name = safe_name.replace(" ", "-").replace("–", "-")
    safe_name = "".join(c for c in safe_name if (c.isascii() and c.isalnum()) or c == "-")
    while "--" in safe_name:
        safe_name = safe_name.replace("--", "-")
    return safe_name.strip("-")


def get_supabase_public_url(path: str) -> str:
    """Get the public URL for a file in Supabase Storage"""
    supabase_url = os.environ.get("SUPABASE_URL", "")
    return f"{supabase_url}/storage/v1/object/public/{SUPABASE_BUCKET}/{path}"


@router.post("/{product_id}/upload-image")
async def upload_product_image(
    product_id: str,
    file: UploadFile = File(...),
    image_type: str = Form("gallery")
):
    """Upload a product image to Supabase Storage"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    if file.content_type not in allowed_types:
        raise HTTPException(status_code=400, detail="Alleen JPEG, PNG, WebP en GIF zijn toegestaan")
    
    contents = await file.read()
    
    if len(contents) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="Bestand is te groot (max 10MB)")
    
    result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    product = result.data[0]
    
    try:
        product_folder = get_product_folder(product.get("short_name") or f"product-{product_id[:8]}")
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        
        if image_type == "main":
            filename = f"main.{file_ext}"
        elif image_type == "macro":
            filename = f"macro.{file_ext}"
        elif image_type == "dimensions":
            filename = f"dimensions.{file_ext}"
        else:
            filename = f"gallery-{uuid.uuid4().hex[:8]}.{file_ext}"
        
        storage_path = f"{product_folder}/{filename}"
        
        # Upload to Supabase Storage (upsert to overwrite existing)
        content_type = file.content_type or "image/jpeg"
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            storage_path, contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        
        image_url = get_supabase_public_url(storage_path)
        
        # Update database based on type
        if image_type == "main":
            supabase.table("products").update({"image": image_url}).eq("id", product_id).execute()
        elif image_type == "macro":
            supabase.table("products").update({"macro_image": image_url}).eq("id", product_id).execute()
        elif image_type == "dimensions":
            supabase.table("products").update({"dimensions_image": image_url}).eq("id", product_id).execute()
        
        logger.info(f"Image uploaded to Supabase Storage: {storage_path}")
        return {"success": True, "url": image_url, "type": image_type}
        
    except Exception as e:
        logger.error(f"Error uploading image for product {product_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{product_id}/photos")
async def upload_product_photos(
    product_id: str,
    files: List[UploadFile] = File(...)
):
    """Upload multiple product photos to Supabase Storage and add to gallery"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    product = result.data[0]
    
    # Parse current gallery
    gallery = product.get("gallery", "[]")
    if isinstance(gallery, str):
        try:
            gallery = json.loads(gallery)
        except:
            gallery = []
    
    # Check max 10 photos limit
    current_count = len(gallery)
    if current_count + len(files) > 10:
        raise HTTPException(
            status_code=400,
            detail=f"Maximaal 10 foto's per product. Je hebt er al {current_count}, en probeert er {len(files)} toe te voegen."
        )
    
    allowed_types = ["image/jpeg", "image/png", "image/webp", "image/gif"]
    product_folder = get_product_folder(product.get("short_name") or f"product-{product_id[:8]}")
    uploaded = []
    
    for file in files:
        if file.content_type not in allowed_types:
            continue
        
        contents = await file.read()
        if len(contents) > 10 * 1024 * 1024:
            continue
        
        file_ext = file.filename.split(".")[-1] if "." in file.filename else "jpg"
        filename = f"gallery-{uuid.uuid4().hex[:8]}.{file_ext}"
        storage_path = f"{product_folder}/{filename}"
        
        try:
            content_type = file.content_type or "image/jpeg"
            supabase.storage.from_(SUPABASE_BUCKET).upload(
                storage_path, contents,
                file_options={"content-type": content_type, "upsert": "true"}
            )
            
            image_url = get_supabase_public_url(storage_path)
            
            gallery.append({
                "url": image_url,
                "alt": f"{product.get('short_name', product.get('name', ''))} - Foto {current_count + len(uploaded) + 1}",
                "visible": True,
                "order": current_count + len(uploaded)
            })
            uploaded.append(image_url)
            
        except Exception as e:
            logger.error(f"Error uploading file {file.filename}: {e}")
    
    # Update gallery in database
    if uploaded:
        supabase.table("products").update({"gallery": json.dumps(gallery)}).eq("id", product_id).execute()
    
    logger.info(f"Uploaded {len(uploaded)} photos for product {product_id}")
    return {
        "success": True,
        "uploaded_count": len(uploaded),
        "urls": uploaded,
        "total_photos": len(gallery)
    }


@router.delete("/{product_id}/photos/{photo_index}")
async def delete_product_photo(product_id: str, photo_index: int):
    """Delete a product photo from gallery by index"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    product = result.data[0]
    gallery = product.get("gallery", "[]")
    if isinstance(gallery, str):
        try:
            gallery = json.loads(gallery)
        except:
            gallery = []
    
    if photo_index < 0 or photo_index >= len(gallery):
        raise HTTPException(status_code=400, detail="Ongeldige foto index")
    
    removed = gallery.pop(photo_index)
    
    # Re-index orders
    for i, item in enumerate(gallery):
        if isinstance(item, dict):
            item["order"] = i
    
    supabase.table("products").update({"gallery": json.dumps(gallery)}).eq("id", product_id).execute()
    
    logger.info(f"Deleted photo {photo_index} from product {product_id}")
    return {"success": True, "remaining_photos": len(gallery)}


@router.put("/{product_id}/photos/reorder")
async def reorder_product_photos(product_id: str, order: dict):
    """Reorder product gallery photos"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("products").select("*").eq("id", product_id).limit(1).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="Product niet gevonden")
    
    product = result.data[0]
    gallery = product.get("gallery", "[]")
    if isinstance(gallery, str):
        try:
            gallery = json.loads(gallery)
        except:
            gallery = []
    
    new_order = order.get("indices", [])
    if len(new_order) != len(gallery):
        raise HTTPException(status_code=400, detail="Ongeldige volgorde")
    
    reordered = [gallery[i] for i in new_order if i < len(gallery)]
    for i, item in enumerate(reordered):
        if isinstance(item, dict):
            item["order"] = i
    
    supabase.table("products").update({"gallery": json.dumps(reordered)}).eq("id", product_id).execute()
    
    return {"success": True, "gallery": reordered}


# ============== PHOTO MIGRATION (Local → Supabase Storage) ==============

import mimetypes

@router.post("/migrate-photos/start")
async def migrate_photos_to_supabase():
    """Migrate all local product photos to Supabase Storage and update DB references"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    local_dir = "/app/frontend/public/products"
    if not os.path.exists(local_dir):
        return {"success": False, "error": "Geen lokale productfoto's gevonden"}
    
    # Get all products
    result = supabase.table("products").select("*").execute()
    products = result.data or []
    
    migrated = 0
    skipped = 0
    errors = []
    product_updates = []
    
    for product in products:
        product_id = product["id"]
        product_name = product.get("short_name") or product.get("name") or f"product-{product_id[:8]}"
        folder = get_product_folder(product_name)
        
        updates = {}
        
        # Migrate main image
        image_path = product.get("image", "")
        if image_path and image_path.startswith("/products/") and "supabase" not in image_path:
            local_path = f"/app/frontend/public{image_path}"
            if os.path.exists(local_path):
                new_url = await _upload_local_file(local_path, folder, "main")
                if new_url:
                    updates["image"] = new_url
                    migrated += 1
                else:
                    skipped += 1
            else:
                skipped += 1
        
        # Migrate macro image
        macro_path = product.get("macro_image", "")
        if macro_path and macro_path.startswith("/products/") and "supabase" not in macro_path:
            local_path = f"/app/frontend/public{macro_path}"
            if os.path.exists(local_path):
                new_url = await _upload_local_file(local_path, folder, "macro")
                if new_url:
                    updates["macro_image"] = new_url
                    migrated += 1
        
        # Migrate dimensions image
        dims_path = product.get("dimensions_image", "")
        if dims_path and dims_path.startswith("/products/") and "supabase" not in dims_path:
            local_path = f"/app/frontend/public{dims_path}"
            if os.path.exists(local_path):
                new_url = await _upload_local_file(local_path, folder, "dimensions")
                if new_url:
                    updates["dimensions_image"] = new_url
                    migrated += 1
        
        # Migrate gallery images
        gallery = product.get("gallery", "[]")
        if isinstance(gallery, str):
            try:
                gallery = json.loads(gallery)
            except:
                gallery = []
        
        new_gallery = []
        for i, item in enumerate(gallery):
            img_url = item if isinstance(item, str) else item.get("url", "")
            alt = "" if isinstance(item, str) else item.get("alt", "")
            visible = True if isinstance(item, str) else item.get("visible", True)
            
            if img_url.startswith("/products/") and "supabase" not in img_url:
                local_path = f"/app/frontend/public{img_url}"
                if os.path.exists(local_path):
                    new_url = await _upload_local_file(local_path, folder, f"gallery-{i}")
                    if new_url:
                        new_gallery.append({"url": new_url, "alt": alt, "visible": visible, "order": i})
                        migrated += 1
                        continue
            
            # Keep existing (already Supabase or external URL)
            if isinstance(item, dict):
                new_gallery.append(item)
            else:
                new_gallery.append({"url": img_url, "alt": alt, "visible": visible, "order": i})
        
        if new_gallery and new_gallery != gallery:
            updates["gallery"] = json.dumps(new_gallery)
        
        # Apply updates
        if updates:
            try:
                supabase.table("products").update(updates).eq("id", product_id).execute()
                product_updates.append({"product": product_name, "fields_updated": list(updates.keys())})
            except Exception as e:
                errors.append(f"Product {product_name}: {str(e)[:100]}")
    
    return {
        "success": True,
        "migrated_files": migrated,
        "skipped": skipped,
        "products_updated": len(product_updates),
        "updates": product_updates,
        "errors": errors
    }


async def _upload_local_file(local_path: str, folder: str, name: str) -> str:
    """Upload a local file to Supabase Storage and return URL"""
    try:
        with open(local_path, "rb") as f:
            contents = f.read()
        
        ext = os.path.splitext(local_path)[1].lower() or ".png"
        content_type = mimetypes.guess_type(local_path)[0] or "image/png"
        storage_path = f"{folder}/{name}{ext}"
        
        supabase.storage.from_(SUPABASE_BUCKET).upload(
            storage_path, contents,
            file_options={"content-type": content_type, "upsert": "true"}
        )
        
        return get_supabase_public_url(storage_path)
    except Exception as e:
        logger.error(f"Error uploading {local_path}: {e}")
        return None


@router.get("/migrate-photos/status")
async def get_migration_status():
    """Check how many images are already on Supabase vs local"""
    if supabase is None:
        raise HTTPException(status_code=500, detail="Database not configured")
    
    result = supabase.table("products").select("*").execute()
    products = result.data or []
    
    local_count = 0
    supabase_count = 0
    total_images = 0
    
    for product in products:
        for field in ["image", "macro_image", "dimensions_image"]:
            val = product.get(field, "")
            if val:
                total_images += 1
                if "supabase" in val:
                    supabase_count += 1
                elif val.startswith("/products/"):
                    local_count += 1
        
        gallery = product.get("gallery", "[]")
        if isinstance(gallery, str):
            try:
                gallery = json.loads(gallery)
            except:
                gallery = []
        
        for item in gallery:
            url = item if isinstance(item, str) else item.get("url", "")
            if url:
                total_images += 1
                if "supabase" in url:
                    supabase_count += 1
                elif url.startswith("/products/"):
                    local_count += 1
    
    return {
        "total_images": total_images,
        "local": local_count,
        "supabase": supabase_count,
        "other": total_images - local_count - supabase_count,
        "migration_complete": local_count == 0
    }
