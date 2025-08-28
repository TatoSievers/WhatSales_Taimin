
import React, { createContext, useState, useContext, useMemo, useCallback } from 'react';
import { Product, ProductContextType, NewProduct } from '../types';
import { mockProducts } from '../data/products';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>(mockProducts);
  const [loading, setLoading] = useState(false); // Data is loaded synchronously now.

  const addProduct = useCallback((productData: NewProduct) => {
    setProducts(prevProducts => {
      const newProduct: Product = {
        id: Date.now(), // Simple ID generation for in-session changes
        ...productData,
      };
      return [...prevProducts, newProduct];
    });
  }, []);

  const updateProduct = useCallback((updatedProduct: Product) => {
    setProducts(prevProducts => 
      prevProducts.map(p =>
        p.id === updatedProduct.id ? updatedProduct : p
      )
    );
  }, []);

  const deleteProduct = useCallback((productId: number) => {
    setProducts(prevProducts => 
      prevProducts.filter(p => p.id !== productId)
    );
  }, []);

  const value = useMemo(() => ({
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    loading
  }), [products, addProduct, updateProduct, deleteProduct, loading]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};
