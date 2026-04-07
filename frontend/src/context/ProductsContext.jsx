import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiUrl } from '../api/client';

const ProductsContext = createContext();

export const useProducts = () => {
  const context = useContext(ProductsContext);
  if (!context) {
    throw new Error('useProducts must be used within a ProductsProvider');
  }
  return context;
};

export const ProductsProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all products from API
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(apiUrl('/api/products'));
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching products:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch single product by ID
  const fetchProductById = useCallback(async (id) => {
    try {
      const response = await fetch(apiUrl(`/api/products/${id}`));
      if (!response.ok) {
        throw new Error('Product not found');
      }
      return await response.json();
    } catch (err) {
      console.error('Error fetching product:', err);
      return null;
    }
  }, []);

  // Get product from local state (faster)
  const getProductById = useCallback((id) => {
    // Support both string UUIDs and numeric IDs
    return products.find(p => String(p.id) === String(id));
  }, [products]);

  // Refresh products
  const refreshProducts = useCallback(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Load products on mount
  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const value = {
    products,
    loading,
    error,
    fetchProducts,
    fetchProductById,
    getProductById,
    refreshProducts,
  };

  return (
    <ProductsContext.Provider value={value}>
      {children}
    </ProductsContext.Provider>
  );
};

export default ProductsContext;
