import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { Product, ProductContextType, NewProduct } from '../types';
import { supabase } from '../lib/supabaseClient';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
        
      if (dbError) {
        throw new Error(dbError.message);
      }
      
      setProducts(data || []);

    } catch (err: any) {
      console.error('Falha detalhada ao buscar produtos:', err);
      setError('Não foi possível carregar os produtos. Verifique sua conexão e a configuração do banco de dados.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (productData: NewProduct) => {
    const { data, error } = await supabase
      .from('products')
      .insert(productData)
      .select()
      .single();

    if (error) {
      console.error('Erro ao adicionar produto:', error);
    } else if (data) {
      setProducts(prevProducts => [...prevProducts, data]);
    }
  }, []);

  const updateProduct = useCallback(async (updatedProduct: Product) => {
    const { data, error } = await supabase
      .from('products')
      .update(updatedProduct)
      .eq('id', updatedProduct.id)
      .select()
      .single();
      
    if (error) {
      console.error('Erro ao atualizar produto:', error);
    } else if (data) {
      setProducts(prevProducts =>
        prevProducts.map(p => (p.id === data.id ? data : p))
      );
    }
  }, []);

  const deleteProduct = useCallback(async (productId: number) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', productId);

    if (error) {
      console.error('Erro ao deletar produto:', error);
    } else {
      setProducts(prevProducts =>
        prevProducts.filter(p => p.id !== productId)
      );
    }
  }, []);

  const value = useMemo(() => ({
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    loading,
    error,
  }), [products, addProduct, updateProduct, deleteProduct, loading, error]);

  return <ProductContext.Provider value={value}>{children}</ProductContext.Provider>;
};

export const useProducts = () => {
  const context = useContext(ProductContext);
  if (context === undefined) {
    throw new Error('useProducts must be used within a ProductProvider');
  }
  return context;
};