import { Order, CartItem, Customer, Product } from './types';
import { supabase } from './lib/supabaseClient';

export const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const isPromoActive = (product: Product): boolean => {
  if (!product.promoPrice || product.promoPrice <= 0 || !product.promoEndDate) {
    return false;
  }
  const promoEnd = new Date(product.promoEndDate);
  const today = new Date();
  // The promo is valid until the end of the selected day.
  promoEnd.setUTCHours(23, 59, 59, 999);
  // Ensure we compare just the date part by setting today's time to the start.
  today.setHours(0, 0, 0, 0);
  return promoEnd >= today;
};

export const getDosageForm = (productName: string): string | null => {
  const lowerCaseName = productName.toLowerCase();
  if (lowerCaseName.includes('jiaonang')) {
    return 'Cápsula';
  }
  if (lowerCaseName.includes('pian')) {
    return 'Comprimido';
  }
  if (lowerCaseName.includes('wan')) {
    return 'Pílula';
  }
  if (lowerCaseName.includes('spray')) {
    return 'Spray';
  }
  if (lowerCaseName.includes('tubo')) {
    return 'Pomada';
  }
  return null;
};

export const isIOS = (): boolean => {
  // This checks for iPad, iPhone, iPod and ensures it's not a Windows Phone
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

export const getOrders = async (): Promise<Order[]> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.error("Erro ao buscar pedidos:", error);
      throw error;
    }
    // A tipagem do Supabase pode não ser perfeita, então garantimos que os campos corretos existam.
    return (data || []).map(order => ({
      ...order,
      items: order.items || [],
      customer: order.customer || { name: '', email: '', cpf: '' },
    })) as Order[];
  } catch (error) {
    console.error("Falha ao carregar pedidos do Supabase", error);
    return [];
  }
};

export const addOrder = async (items: CartItem[], customer: Customer, totalPrice: number): Promise<{ customerStatus: 'pending' | 'registered' }> => {
  try {
    // Verifica se o cliente já existe baseado no CPF
    const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer->>cpf', customer.cpf) // Query em coluna JSONB
      .limit(1);

    if (fetchError) {
      console.error("Erro ao verificar cliente existente:", fetchError);
    }

    const customerStatus = (!existingOrders || existingOrders.length === 0) ? 'pending' : 'registered';

    const newOrder = {
      // id é gerado automaticamente pelo Supabase (UUID)
      date: new Date().toISOString(),
      customer,
      items,
      totalPrice,
      status: 'open',
      observation: '',
      customerStatus,
    };

    const { error: insertError } = await supabase.from('orders').insert(newOrder);

    if (insertError) {
      console.error("Erro ao salvar pedido no Supabase:", insertError);
      throw insertError;
    }

    return { customerStatus };
  } catch (error) {
    console.error("Falha ao salvar pedido no Supabase", error);
    return { customerStatus: 'pending' }; // Assume pendente em caso de erro
  }
};

export const updateOrder = async (updatedOrder: Order): Promise<void> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({
        status: updatedOrder.status,
        observation: updatedOrder.observation,
        customerStatus: updatedOrder.customerStatus,
      })
      .eq('id', updatedOrder.id);

    if (error) {
      console.error("Erro ao atualizar pedido:", error);
      throw error;
    }
  } catch (error) {
    console.error("Falha ao atualizar pedido no Supabase", error);
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('id', orderId);

    if (error) {
      console.error("Erro ao deletar pedido:", error);
      throw error;
    }
  } catch (error) {
    console.error("Falha ao deletar pedido no Supabase", error);
    throw error;
  }
};

export const getPopupConfig = async (): Promise<import('./types').PopupConfig | null> => {
  try {
    const { data, error } = await supabase
      .from('app_settings')
      .select('value')
      .eq('key', 'popup_config')
      .single();

    if (error) {
      console.error("Erro ao buscar configurações do popup:", error);
      return null;
    }
    return data?.value || null;
  } catch (error) {
    console.error("Falha ao buscar configurações do popup", error);
    return null;
  }
};

export const updatePopupConfig = async (config: import('./types').PopupConfig): Promise<void> => {
  try {
    const { error } = await supabase
      .from('app_settings')
      .upsert({ key: 'popup_config', value: config });

    if (error) {
      console.error("Erro ao atualizar configurações do popup:", error);
      throw error;
    }
  } catch (error) {
    console.error("Falha ao atualizar configurações do popup", error);
    throw error;
  }
};