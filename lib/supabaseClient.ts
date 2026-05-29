import { createClient } from '@supabase/supabase-js';
import { mockProducts } from '../data/products';

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

console.log('--- Supabase Config Check ---');
console.log('URL provided:', !!supabaseUrl);
console.log('Key provided:', !!supabaseAnonKey);
console.log('Mode:', (import.meta as any).env.MODE);

let initializationError: string | null = null;
let supabaseInstance: any;

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

  initializationError = `ERRO DE CONFIGURAÇÃO: A(s) variável(is) de ambiente ${missingVars.join(' e ')} não foi(foram) encontrada(s). Verifique as configurações do seu projeto na Vercel.`;
  console.error(initializationError);

  // Mock chain implementation to prevent crash and return demo data using localStorage
  const createMockChain = (tableName: string) => {
    let isSingle = false;
    let queryKey: string | null = null;
    let eqColumn: string | null = null;
    let eqValue: any = null;
    
    const chain: any = {
      select: () => chain,
      insert: (payload: any) => {
        if (tableName === 'orders') {
          const orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
          const newOrder = Array.isArray(payload) ? payload[0] : payload;
          if (!newOrder.id) {
            newOrder.id = 'mock-id-' + Math.random().toString(36).substr(2, 9);
          }
          orders.push(newOrder);
          localStorage.setItem('mock_orders', JSON.stringify(orders));
        }
        return chain;
      },
      update: (payload: any) => {
        chain.updatePayload = payload;
        return chain;
      },
      delete: () => {
        chain.isDelete = true;
        return chain;
      },
      upsert: (payload: any) => {
        const item = Array.isArray(payload) ? payload[0] : payload;
        if (tableName === 'app_settings' && item?.key) {
          localStorage.setItem(`mock_app_settings_${item.key}`, JSON.stringify(item.value));
        }
        return chain;
      },
      eq: (col: string, val: any) => {
        eqColumn = col;
        eqValue = val;
        if (col === 'key') {
          queryKey = val;
        }
        return chain;
      },
      limit: () => chain,
      order: () => chain,
      single: () => {
        isSingle = true;
        return chain;
      },
      then: (resolve: any) => {
        let data: any = [];
        if (tableName === 'products') {
          data = mockProducts;
        } else if (tableName === 'app_settings') {
          if (queryKey) {
            const localVal = localStorage.getItem(`mock_app_settings_${queryKey}`);
            if (localVal) {
              data = { key: queryKey, value: JSON.parse(localVal) };
            } else if (queryKey === 'popup_config') {
              data = { key: 'popup_config', value: { active: false, text: '', expiresAt: null } };
            } else if (queryKey === 'whatsapp_config') {
              data = { 
                key: 'whatsapp_config', 
                value: { 
                  whatsappNumber: '5511946430386', 
                  whatsappReceiverName: 'Samantha', 
                  whatsappMessageTemplate: 'Olá! Meu nome é {nome} (CPF: {cpf}) e gostaria de fazer o seguinte pedido:\n\n{itens}\n\n*Total: {total}*\n\n{mensagem_fechamento}' 
                } 
              };
            } else {
              data = null;
            }
          } else {
            data = [];
          }
        } else if (tableName === 'orders') {
          let orders = JSON.parse(localStorage.getItem('mock_orders') || '[]');
          
          if (chain.updatePayload && eqColumn === 'id') {
            orders = orders.map((o: any) => o.id === eqValue ? { ...o, ...chain.updatePayload } : o);
            localStorage.setItem('mock_orders', JSON.stringify(orders));
          } else if (chain.isDelete && eqColumn === 'id') {
            orders = orders.filter((o: any) => o.id !== eqValue);
            localStorage.setItem('mock_orders', JSON.stringify(orders));
          }
          
          data = orders;
        }

        if (isSingle) {
          data = Array.isArray(data) ? data[0] || null : data;
        }
        resolve({ data, error: null });
      }
    };
    return chain;
  };

  supabaseInstance = {
    from: (tableName: string) => createMockChain(tableName),
    auth: {
      getSession: async () => {
        const isLoggedIn = localStorage.getItem('mock_admin_logged_in') === 'true';
        return {
          data: {
            session: isLoggedIn ? {
              access_token: 'mock-token',
              user: { email: 'admin@taimin.com.br' }
            } : null
          },
          error: null
        };
      },
      onAuthStateChange: (callback: any) => {
        // Trigger callback on subscription to notify initial state
        const isLoggedIn = localStorage.getItem('mock_admin_logged_in') === 'true';
        const session = isLoggedIn ? {
          access_token: 'mock-token',
          user: { email: 'admin@taimin.com.br' }
        } : null;
        setTimeout(() => callback('SIGNED_IN', session), 0);
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      signInWithPassword: async (credentials: any) => {
        localStorage.setItem('mock_admin_logged_in', 'true');
        return {
          data: {
            session: {
              access_token: 'mock-token',
              user: { email: credentials.email || 'admin@taimin.com.br' }
            },
            user: { email: credentials.email || 'admin@taimin.com.br' }
          },
          error: null
        };
      },
      signOut: async () => {
        localStorage.removeItem('mock_admin_logged_in');
        return { error: null };
      },
    }
  };
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;
export const supabaseInitializationError = initializationError;
