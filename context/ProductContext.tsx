import React, { createContext, useState, useContext, useMemo, useCallback, useEffect } from 'react';
import { Product, ProductContextType, NewProduct } from '../types';
import { supabase, supabaseInitializationError } from '../lib/supabaseClient';

const ProductContext = createContext<ProductContextType | undefined>(undefined);

export const ProductProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    // Primeiro, verifica se houve um erro na inicialização do cliente Supabase.
    if (supabaseInitializationError) {
      setError(supabaseInitializationError); // Usa a mensagem de erro específica.
      setProducts([]);
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

      setProducts(data || []);

    } catch (err: any) {
      console.error('Falha detalhada ao buscar produtos:', err);
      setError('Não foi possível carregar os produtos. Verifique sua conexão e se as chaves de API estão corretas e válidas.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    setLoading(true);
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
      setError('Falha ao adicionar produto.');
    } else if (data) {
      setProducts(prev => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    }
  }, []);

  const updateProduct = useCallback(async (productId: number, updates: Partial<Omit<Product, 'id'>>) => {
    const { error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', productId);

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      setError('Falha ao atualizar produto.');
    } else {
      setProducts(prev =>
        prev.map(p => (p.id === productId ? { ...p, ...updates } : p))
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
      setError('Falha ao excluir produto.');
    } else {
      setProducts(prev => prev.filter(p => p.id !== productId));
    }
  }, []);

  const applyBulkPromotion = useCallback(async (discountPercent: number | null, startDate: string | null, endDate: string | null) => {
    setLoading(true);
    setError(null);
    try {
      let updates: any[] = [];
      const isClearOperation = discountPercent === null && startDate === null && endDate === null;

      // 1. Fetch current data to ensure we calculate based on fresh prices (if applying discount)
      const { data: currentProducts, error: fetchError } = await supabase
        .from('products')
        .select('*');

      if (fetchError) throw fetchError;
      if (!currentProducts) return;

      // 2. Prepare updates
      if (isClearOperation) {
        // Clear all promos
        updates = currentProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl,
          quantityInfo: p.quantityInfo,
          action: p.action,
          indication: p.indication,
          visibility: p.visibility,
          promoPrice: null,
          promoStartDate: null,
          promoEndDate: null
        }));
      } else if (discountPercent !== null) {
        // Apply discount to all
        updates = currentProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl,
          quantityInfo: p.quantityInfo,
          action: p.action,
          indication: p.indication,
          visibility: p.visibility,
          promoPrice: p.price * (1 - discountPercent / 100),
          promoStartDate: startDate,
          promoEndDate: endDate
        }));
      } else {
        // Just update dates (preserve existing promo prices if any, or just set dates)
        updates = currentProducts.map(p => ({
          id: p.id,
          name: p.name,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl,
          quantityInfo: p.quantityInfo,
          action: p.action,
          indication: p.indication,
          visibility: p.visibility,
          promoPrice: p.promoPrice,
          promoStartDate: startDate,
          promoEndDate: endDate
        }));
      }

      console.log('🔍 Bulk Promotion Debug:', {
        discountPercent,
        startDate,
        endDate,
        totalProducts: currentProducts.length
      });

      // 3. Update each product individually to avoid GENERATED ALWAYS column issues
      const updatePromises = currentProducts.map(async (p) => {
        const updateData: any = {
          name: p.name,
          price: p.price,
          category: p.category,
          imageUrl: p.imageUrl,
          quantityInfo: p.quantityInfo,
          action: p.action,
          indication: p.indication,
          visibility: p.visibility,
        };

        if (isClearOperation) {
          updateData.promoPrice = null;
          updateData.promoStartDate = null;
          updateData.promoEndDate = null;
        } else if (discountPercent !== null) {
          updateData.promoPrice = p.price * (1 - discountPercent / 100);
          updateData.promoStartDate = startDate;
          updateData.promoEndDate = endDate;
        } else {
          updateData.promoPrice = p.promoPrice;
          updateData.promoStartDate = startDate;
          updateData.promoEndDate = endDate;
        }

        const { error } = await supabase
          .from('products')
          .update(updateData)
          .eq('id', p.id);

        if (error) throw error;
        return { ...p, ...updateData };
      });

      const updatedProducts = await Promise.all(updatePromises);

      console.log('✅ Bulk promotion applied to', updatedProducts.length, 'products');

      // 4. Update local state
      if (updatedProducts) {
        setProducts(updatedProducts.sort((a, b) => a.name.localeCompare(b.name)));
      }
    } catch (err: any) {
      console.error('Erro na promoção em massa:', err);
      setError('Falha ao aplicar promoção em massa.');
    } finally {
      setLoading(false);
    }
  }, []);

  const value = useMemo(() => ({
    products,
    addProduct,
    updateProduct,
    deleteProduct,
    applyBulkPromotion,
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
