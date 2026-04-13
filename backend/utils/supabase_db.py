"""
Supabase Database Configuration and Helper Functions
Droomvriendjes.nl
"""
import os
import logging
from typing import Any, Dict, List, Optional
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# Supabase configuration
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://qoykbhocordugtbvpvsl.supabase.co")
SUPABASE_ANON_KEY = os.environ.get("SUPABASE_ANON_KEY", "")
SUPABASE_SERVICE_KEY = os.environ.get("SUPABASE_SERVICE_KEY", "")
# SUPABASE_KEY is a generic alias accepted from Railway environment variables
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "")

# Singleton client
_supabase_client: Optional[Client] = None


def get_supabase_client() -> Client:
    """
    Get or create Supabase client singleton.
    Uses service role key for backend operations.
    """
    global _supabase_client
    
    if _supabase_client is not None:
        return _supabase_client
    
    # Use service role key for backend (full access)
    # Prefer service key, then generic SUPABASE_KEY, then anon key
    api_key = SUPABASE_SERVICE_KEY or SUPABASE_KEY or SUPABASE_ANON_KEY
    
    if not api_key:
        raise ValueError("SUPABASE_SERVICE_KEY, SUPABASE_KEY, or SUPABASE_ANON_KEY must be set")
    
    _supabase_client = create_client(SUPABASE_URL, api_key)
    logger.info(f"✅ Supabase connected to: {SUPABASE_URL}")
    
    return _supabase_client


def get_supabase() -> Client:
    """Alias for get_supabase_client()"""
    return get_supabase_client()


# ============================================
# CRUD Helper Functions
# ============================================

class SupabaseTable:
    """
    Helper class for common Supabase table operations.
    Mimics some MongoDB-style operations for easier migration.
    """
    
    def __init__(self, table_name: str):
        self.table_name = table_name
        self.client = get_supabase_client()
    
    async def find_one(self, filters: Dict[str, Any]) -> Optional[Dict]:
        """Find a single document matching filters"""
        try:
            query = self.client.table(self.table_name).select("*")
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.limit(1).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"find_one error on {self.table_name}: {e}")
            return None
    
    async def find(self, filters: Optional[Dict[str, Any]] = None, limit: int = 1000) -> List[Dict]:
        """Find all documents matching filters"""
        try:
            query = self.client.table(self.table_name).select("*")
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            result = query.limit(limit).execute()
            return result.data or []
            
        except Exception as e:
            logger.error(f"find error on {self.table_name}: {e}")
            return []
    
    async def insert_one(self, document: Dict[str, Any]) -> Optional[Dict]:
        """Insert a single document"""
        try:
            result = self.client.table(self.table_name).insert(document).execute()
            
            if result.data and len(result.data) > 0:
                return result.data[0]
            return None
            
        except Exception as e:
            logger.error(f"insert_one error on {self.table_name}: {e}")
            raise
    
    async def update_one(self, filters: Dict[str, Any], update: Dict[str, Any]) -> bool:
        """Update a single document matching filters"""
        try:
            query = self.client.table(self.table_name).update(update)
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            return len(result.data) > 0 if result.data else False
            
        except Exception as e:
            logger.error(f"update_one error on {self.table_name}: {e}")
            return False
    
    async def delete_one(self, filters: Dict[str, Any]) -> bool:
        """Delete a single document matching filters"""
        try:
            query = self.client.table(self.table_name).delete()
            
            for key, value in filters.items():
                query = query.eq(key, value)
            
            result = query.execute()
            return len(result.data) > 0 if result.data else False
            
        except Exception as e:
            logger.error(f"delete_one error on {self.table_name}: {e}")
            return False
    
    async def count(self, filters: Optional[Dict[str, Any]] = None) -> int:
        """Count documents matching filters"""
        try:
            query = self.client.table(self.table_name).select("*", count="exact")
            
            if filters:
                for key, value in filters.items():
                    query = query.eq(key, value)
            
            result = query.execute()
            return result.count or 0
            
        except Exception as e:
            logger.error(f"count error on {self.table_name}: {e}")
            return 0


# ============================================
# Synchronous versions for non-async contexts
# ============================================

def find_one_sync(table_name: str, filters: Dict[str, Any]) -> Optional[Dict]:
    """Synchronous find_one"""
    try:
        client = get_supabase_client()
        query = client.table(table_name).select("*")
        
        for key, value in filters.items():
            query = query.eq(key, value)
        
        result = query.limit(1).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
        
    except Exception as e:
        logger.error(f"find_one_sync error: {e}")
        return None


def find_sync(table_name: str, filters: Optional[Dict[str, Any]] = None, limit: int = 1000) -> List[Dict]:
    """Synchronous find"""
    try:
        client = get_supabase_client()
        query = client.table(table_name).select("*")
        
        if filters:
            for key, value in filters.items():
                query = query.eq(key, value)
        
        result = query.limit(limit).execute()
        return result.data or []
        
    except Exception as e:
        logger.error(f"find_sync error: {e}")
        return []


def insert_sync(table_name: str, document: Dict[str, Any]) -> Optional[Dict]:
    """Synchronous insert"""
    try:
        client = get_supabase_client()
        result = client.table(table_name).insert(document).execute()
        
        if result.data and len(result.data) > 0:
            return result.data[0]
        return None
        
    except Exception as e:
        logger.error(f"insert_sync error: {e}")
        raise


def update_sync(table_name: str, filters: Dict[str, Any], update: Dict[str, Any]) -> bool:
    """Synchronous update"""
    try:
        client = get_supabase_client()
        query = client.table(table_name).update(update)
        
        for key, value in filters.items():
            query = query.eq(key, value)
        
        result = query.execute()
        return len(result.data) > 0 if result.data else False
        
    except Exception as e:
        logger.error(f"update_sync error: {e}")
        return False


def delete_sync(table_name: str, filters: Dict[str, Any]) -> bool:
    """Synchronous delete"""
    try:
        client = get_supabase_client()
        query = client.table(table_name).delete()
        
        for key, value in filters.items():
            query = query.eq(key, value)
        
        result = query.execute()
        return len(result.data) > 0 if result.data else False
        
    except Exception as e:
        logger.error(f"delete_sync error: {e}")
        return False
