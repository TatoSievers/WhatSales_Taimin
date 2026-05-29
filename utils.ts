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
  promoEnd.setUTCHours(23, 59, 59, 999);
  today.setHours(0, 0, 0, 0);
  return promoEnd >= today;
};

export const getDosageForm = (productName: string): string | null => {
  const lowerCaseName = productName.toLowerCase();
  if (lowerCaseName.includes('jiaonang')) return 'Cápsula';
  if (lowerCaseName.includes('pian')) return 'Comprimido';
  if (lowerCaseName.includes('wan')) return 'Pílula';
  if (lowerCaseName.includes('spray')) return 'Spray';
  if (lowerCaseName.includes('tubo')) return 'Pomada';
  return null;
};

export const isIOS = (): boolean => {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
};

// ─── Busca configuração do WhatsApp (atendente) ───────────────────────────────
const getAttendantName = async (): Promise<string> => {
  if (isDemoMode) return 'Samantha';
  try {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('whatsapp_receiver_name')
      .limit(1)
      .single();
    if (error || !data) return 'Samantha';
    return data.whatsapp_receiver_name || 'Samantha';
  } catch {
    return 'Samantha';
  }
};

// ─── getOrders ────────────────────────────────────────────────────────────────
export const getOrders = async (): Promise<Order[]> => {
  if (isDemoMode) return getLocalOrders();
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date', { ascending: false });

    if (error) {
      console.warn('Erro ao buscar pedidos do Supabase, usando fallback local:', error);
      return getLocalOrders();
    }

    const ordersList = (data || []).map(order => ({
      ...order,
      items: order.items || [],
      customer: order.customer || { name: '', email: '', cpf: '' },
      receivedBy: order.receivedBy || order.received_by || '',
    })) as Order[];

    saveLocalOrders(ordersList);
    return ordersList;
  } catch (error) {
    console.warn('Falha ao carregar pedidos do Supabase, usando fallback local:', error);
    return getLocalOrders();
  }
};

// ─── addOrder ─────────────────────────────────────────────────────────────────
export const addOrder = async (
  items: CartItem[],
  customer: Customer,
  totalPrice: number
): Promise<{ customerStatus: 'pending' | 'registered' }> => {

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
      receivedBy: 'Samantha',
    };
    saveLocalOrders([newOrder, ...orders]);
    return { customerStatus };
  }

  try {
    // Verifica se o cliente já existe pelo CPF
    const { data: existingOrders, error: fetchError } = await supabase
      .from('orders')
      .select('id')
      .eq('customer->>cpf', customer.cpf)
      .limit(1);

    if (fetchError) {
      console.warn('Erro ao verificar cliente existente no Supabase:', fetchError);
    }

    const customerStatus = (!existingOrders || existingOrders.length === 0) ? 'pending' : 'registered';

    // Busca o nome do atendente atual da config
    const attendantName = await getAttendantName();

    const newOrder = {
      date: new Date().toISOString(),
      customer,
      items,
      totalPrice,
      status: 'open',
      observation: '',
      customerStatus,
      receivedBy: attendantName,
    };

    const { error: insertError } = await supabase.from('orders').insert(newOrder);

    if (insertError) {
      console.error('Erro ao salvar pedido no Supabase:', insertError);
      throw insertError;
    }

    return { customerStatus };
  } catch (error) {
    console.warn('Falha ao salvar pedido no Supabase, salvando localmente:', error);
    const orders = getLocalOrders();
    const customerStatus = orders.some(o => o.customer?.cpf === customer.cpf)
      ? 'registered' as const
      : 'pending' as const;

    const newOrder: Order = {
      id: 'local_' + Date.now() + '_' + Math.floor(Math.random() * 1000),
      date: new Date().toISOString(),
      customer,
      items,
      totalPrice,
      status: 'open',
      observation: '',
      customerStatus,
      receivedBy: 'Samantha',
    };
    saveLocalOrders([newOrder, ...orders]);
    return { customerStatus };
  }
};

// ─── updateOrder ──────────────────────────────────────────────────────────────
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
        receivedBy: updatedOrder.receivedBy || 'Samantha', // FIX: persiste o atendente
      })
      .eq('id', updatedOrder.id);

    if (error) {
      console.error('Erro ao atualizar pedido:', error);
      throw error;
    }
  } catch (error) {
    console.warn('Falha ao atualizar pedido no Supabase, atualizando localmente:', error);
    const orders = getLocalOrders();
    const idx = orders.findIndex(o => String(o.id) === String(updatedOrder.id));
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...updatedOrder };
      saveLocalOrders(orders);
    }
  }
};

// ─── deleteOrder ──────────────────────────────────────────────────────────────
export const deleteOrder = async (orderId: string): Promise<void> => {
  if (isDemoMode || String(orderId).startsWith('local_')) {
    const orders = getLocalOrders();
    saveLocalOrders(orders.filter(o => String(o.id) !== String(orderId)));
    return;
  }

  try {
    const { error } = await supabase.from('orders').delete().eq('id', orderId);
    if (error) {
      console.error('Erro ao deletar pedido:', error);
      throw error;
    }
  } catch (error) {
    console.warn('Falha ao deletar pedido no Supabase, removendo localmente:', error);
    const orders = getLocalOrders();
    saveLocalOrders(orders.filter(o => String(o.id) !== String(orderId)));
  }
};

// ─── migrateOldOrders — atribui "Samantha" a pedidos sem atendente ────────────
// Chamar uma vez no carregamento do Admin (useEffect).
export const migrateOldOrdersAttendant = async (): Promise<void> => {
  if (isDemoMode) {
    const orders = getLocalOrders();
    const updated = orders.map(o => ({
      ...o,
      receivedBy: o.receivedBy || 'Samantha',
    }));
    saveLocalOrders(updated);
    return;
  }

  try {
    // Atualiza em massa apenas os pedidos onde receivedBy é nulo ou vazio
    const { error } = await supabase
      .from('orders')
      .update({ receivedBy: 'Samantha' })
      .or('receivedBy.is.null,receivedBy.eq.');

    if (error) {
      console.warn('Erro na migração de atendente nos pedidos antigos:', error);
    }
  } catch (error) {
    console.warn('Falha na migração de atendente:', error);
  }
};

// ─── getPopupConfig ───────────────────────────────────────────────────────────
export const getPopupConfig = async (): Promise<any | null> => {
  if (isDemoMode) return null;
  try {
    const { data, error } = await supabase
      .from('popup_config')
      .select('*')
      .limit(1)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

export const updatePopupConfig = async (config: any): Promise<void> => {
  if (isDemoMode) return;
  try {
    const { data: existing } = await supabase
      .from('popup_config')
      .select('id')
      .limit(1)
      .single();

    if (existing?.id) {
      await supabase.from('popup_config').update(config).eq('id', existing.id);
    } else {
      await supabase.from('popup_config').insert(config);
    }
  } catch (error) {
    console.error('Erro ao atualizar popup config:', error);
    throw error;
  }
};

// ─── getWhatsappConfig ────────────────────────────────────────────────────────
export const getWhatsappConfig = async (): Promise<any | null> => {
  if (isDemoMode) return null;
  try {
    const { data, error } = await supabase
      .from('whatsapp_config')
      .select('*')
      .limit(1)
      .single();
    if (error) return null;
    return data;
  } catch {
    return null;
  }
};

export const updateWhatsappConfig = async (config: any): Promise<void> => {
  if (isDemoMode) return;
  try {
    const { data: existing } = await supabase
      .from('whatsapp_config')
      .select('id')
      .limit(1)
      .single();

    if (existing?.id) {
      await supabase.from('whatsapp_config').update(config).eq('id', existing.id);
    } else {
      await supabase.from('whatsapp_config').insert(config);
    }
  } catch (error) {
    console.error('Erro ao atualizar whatsapp config:', error);
    throw error;
  }
};
