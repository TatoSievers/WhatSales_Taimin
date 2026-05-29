import { Order, CartItem, Customer, Product } from './types';
import { supabase, supabaseInitializationError } from './lib/supabaseClient';

const isDemoMode = !!supabaseInitializationError;

// Local storage helper for sandbox/demo fallback
const getLocalOrders = (): Order[] => {
  try {
    const local = localStorage.getItem('taimin_orders');
    return local ? JSON.parse(local) : [];
  } catch (e) {
    console.error('Erro ao ler pedidos locais do localStorage:', e);
    return [];
  }
};

const saveLocalOrders = (orders: Order[]) => {
  try {
    localStorage.setItem('taimin_orders', JSON.stringify(orders));
  } catch (e) {
    console.error('Erro ao salvar pedidos locais no localStorage:', e);
  }
};

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
  if (isDemoMode) {
    return getLocalOrders();
  }
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn("Erro ao buscar pedidos do Supabase, usando fallback local:", error);
      return getLocalOrders();
    }
    // A tipagem do Supabase pode não ser perfeita, então garantimos que os campos corretos existam.
    const ordersList = (data || []).map(order => ({
      ...order,
      items: order.items || [],
      customer: order.customer || { name: '', email: '', cpf: '' },
    })) as Order[];
    
    // Sincroniza localmente
    saveLocalOrders(ordersList);
    return ordersList;
  } catch (error) {
    console.warn("Falha ao carregar pedidos do Supabase, usando fallback local:", error);
    return getLocalOrders();
  }
};

export const addOrder = async (items: CartItem[], customer: Customer, totalPrice: number): Promise<{ customerStatus: 'pending' | 'registered' }> => {
  if (isDemoMode) {
    const orders = getLocalOrders();
    const existing = orders.some(o => o.customer?.cpf === customer.cpf);
    const customerStatus = existing ? 'registered' : 'pending';
    
    const newOrder: Order = {
      id: 'local_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      date: new Date().toISOString(),
      customer,
      items,
      totalPrice,
      status: 'open',
      observation: '',
      customerStatus,
    };
    saveLocalOrders([newOrder, ...orders]);
    return { customerStatus };
  }

  try {
    // Verifica se o cliente já existe baseado no CPF
    const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer->>cpf', customer.cpf) // Query em coluna JSONB
      .limit(1);

    if (fetchError) {
      console.warn("Erro ao verificar cliente existente no Supabase:", fetchError);
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
    console.warn("Falha ao salvar pedido no Supabase, salvando localmente:", error);
    const orders = getLocalOrders();
    const customerStatus = orders.some(o => o.customer?.cpf === customer.cpf) ? 'registered' as const : 'pending' as const;
    
    const newOrder: Order = {
      id: 'local_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      date: new Date().toISOString(),
      customer,
      items,
      totalPrice,
      status: 'open',
      observation: '',
      customerStatus,
    };
    saveLocalOrders([newOrder, ...orders]);
    return { customerStatus };
  }
};

export const updateOrder = async (updatedOrder: Order): Promise<void> => {
  if (isDemoMode || String(updatedOrder.id).startsWith('local_')) {
    const orders = getLocalOrders();
    const idx = orders.findIndex(o => String(o.id) === String(updatedOrder.id));
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...updatedOrder };
      saveLocalOrders(orders);
    }
    return;
  }

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
    console.warn("Falha ao atualizar pedido no Supabase, atualizando localmente:", error);
    const orders = getLocalOrders();
    const idx = orders.findIndex(o => String(o.id) === String(updatedOrder.id));
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...updatedOrder };
      saveLocalOrders(orders);
    }
  }
};

export const deleteOrder = async (orderId: string): Promise<void> => {
  if (isDemoMode || String(orderId).startsWith('local_')) {
    const orders = getLocalOrders();
    const filtered = orders.filter(o => String(o.id) !== String(orderId));
    saveLocalOrders(filtered);
    return;
  }

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
    console.warn("Falha ao deletar pedido no Supabase, removendo localmente:", error);
    const orders = getLocalOrders();
    const filtered = orders.filter(o => String(o.id) !== String(orderId));
    saveLocalOrders(filtered);
  }
};