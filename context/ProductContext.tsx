import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { Product, ProductContextType, NewProduct } from '../types';
import { supabase, supabaseInitializationError } from '../lib/supabaseClient';
import { mockProducts } from '../data/products';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    // Primeiro, verifica se houve um erro na inicialização do cliente Supabase ou se roda em ambiente sem chaves.
    if (supabaseInitializationError) {
      console.warn("Supabase não configurado. Ativando catálogo local em modo de demonstração.");
      setProducts(mockProducts);
      setError(null);
      setLoading(false);
      return;
    }

    setError(null);
    try {
      const { data, error: dbError } = await supabase
        .from('products')
        .select('*')
        .order('name', { ascending: true });
        
      if (dbError) {
        throw new Error(dbError.message);
      }
      
      // Se não houver produtos no banco remoto, use os mockProducts para que a vitrine não fique vazia.
      if (!data || data.length === 0) {
        setProducts(mockProducts);
      } else {
        setProducts(data);
      }

    } catch (err: any) {
      console.error('Falha detalhada ao buscar produtos, usando catálogo local:', err);
      // Fallback gracioso para os produtos locais caso haja falha de conexão ou erro de credenciais.
      setProducts(mockProducts);
      setError(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts();
  }, [fetchProducts]);

  const addProduct = useCallback(async (productData: NewProduct) => {
    if (supabaseInitializationError) {
      const newProduct: Product = {
        ...productData,
        id: Date.now(),
      };
      setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
      return;
    }

    try {
      const { data, error } = await supabase
        .from('products')
        .insert(productData)
        .select()
        .single();

      if (error) {
        throw error;
      } else if (data) {
        setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err) {
      console.error('Erro ao adicionar produto no banco, adicionando localmente para demonstração:', err);
      const newProduct: Product = {
        ...productData,
        id: Date.now(),
      };
      setProducts(prev => [...prev, newProduct].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  const updateProduct = useCallback(async (productId: number, updates: Partial<Omit<Product, 'id'>>) => {
    if (supabaseInitializationError) {
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, ...updates } : p))
      );
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .update(updates)
        .eq('id', productId);
        
      if (error) {
        throw error;
      } else {
        setProducts(prev =>
          prev.map(p => (p.id === productId ? { ...p, ...updates } : p))
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar produto no banco, atualizando localmente:', err);
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, ...updates } : p))
      );
    }
  }, []);

  const deleteProduct = useCallback(async (productId: number) => {
    if (supabaseInitializationError) {
      setProducts(prev => prev.filter(p => p.id !== productId));
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) {
        throw error;
      } else {
        setProducts(prev => prev.filter(p => p.id !== productId));
      }
    } catch (err) {
      console.error('Erro ao deletar produto no banco, removendo localmente:', err);
      setProducts(prev => prev.filter(p => p.id !== productId));
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
