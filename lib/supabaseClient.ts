import { createClient } from '@supabase/supabase-js';

// As chaves do Supabase DEVEM ser configuradas como variáveis de ambiente no seu projeto Vercel.
// IMPORTANTE: Para que fiquem disponíveis no frontend, elas precisam ter o prefixo VITE_
//
// Nome da variável: VITE_SUPABASE_URL, Valor: [URL do seu projeto Supabase]
// Nome da variável: VITE_SUPABASE_ANON_KEY, Valor: [Sua chave 'anon public' do Supabase]

// Em ambientes de desenvolvimento modernos (como o Vite, usado pela Vercel), 
// as variáveis de ambiente são acessadas via `import.meta.env`.
// FIX: Cast `import.meta` to `any` to resolve TypeScript error `Property 'env' does not exist on type 'ImportMeta'`.
const getEnv = (key: string): string | undefined => {
  try {
    return (import.meta as any).env[key] || (process as any).env[key];
  } catch (e) {
    try {
      return (process as any).env[key];
    } catch (err) {
      return undefined;
    }
  }
};

const rawUrl = getEnv('VITE_SUPABASE_URL');
const rawKey = getEnv('VITE_SUPABASE_ANON_KEY');

const isUrlValid = typeof rawUrl === 'string' && (rawUrl.startsWith('http://') || rawUrl.startsWith('https://'));
const isKeyValid = typeof rawKey === 'string' && rawKey.trim().length > 0 && rawKey !== 'placeholder-key' && rawKey !== '';

const supabaseUrl = isUrlValid ? rawUrl : 'https://placeholder.supabase.co';
const supabaseAnonKey = isKeyValid ? rawKey : 'placeholder-key';

let initializationError: string | null = null;
if (!isUrlValid || !isKeyValid) {
  initializationError = `CRITICAL CONFIGURATION NOTICE: Supabase configuration is missing or invalid (${rawUrl ? 'URL OK' : 'URL MISSING'}, ${rawKey ? 'KEY OK' : 'KEY MISSING'}). Running in demo mode with local mock data.`;
  console.warn(initializationError);
}

// O cliente é criado usando chaves reais ou placeholders para evitar erros que bloqueiem a renderização.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Exporta a mensagem de erro específica para ser usada no contexto da aplicação.
export const supabaseInitializationError = initializationError;
