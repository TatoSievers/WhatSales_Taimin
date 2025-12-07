import { createClient } from '@supabase/supabase-js';

// As chaves do Supabase DEVEM ser configuradas como variáveis de ambiente no seu projeto Vercel.
// IMPORTANTE: Para que fiquem disponíveis no frontend, elas precisam ter o prefixo VITE_
//
// Nome da variável: VITE_SUPABASE_URL, Valor: [URL do seu projeto Supabase]
// Nome da variável: VITE_SUPABASE_ANON_KEY, Valor: [Sua chave 'anon public' do Supabase]

// Em ambientes de desenvolvimento modernos (como o Vite, usado pela Vercel), 
// as variáveis de ambiente são acessadas via `import.meta.env`.
// FIX: Cast `import.meta` to `any` to resolve TypeScript error `Property 'env' does not exist on type 'ImportMeta'`.
const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

let initializationError: string | null = null;
let supabaseInstance: any;

if (!supabaseUrl || !supabaseAnonKey) {
  const missingVars = [];
  if (!supabaseUrl) missingVars.push('VITE_SUPABASE_URL');
  if (!supabaseAnonKey) missingVars.push('VITE_SUPABASE_ANON_KEY');

  initializationError = `ERRO DE CONFIGURAÇÃO: A(s) variável(is) de ambiente ${missingVars.join(' e ')} não foi(foram) encontrada(s). Verifique as configurações do seu projeto na Vercel.`;
  console.error(initializationError);

  // Mock implementation to prevent crash
  const mockChain = () => ({
    select: () => mockChain(),
    insert: () => mockChain(),
    update: () => mockChain(),
    delete: () => mockChain(),
    eq: () => mockChain(),
    limit: () => ({ data: [], error: null }),
    order: () => ({ data: [], error: null }),
    then: (resolve: any) => resolve({ data: [], error: null }),
  });

  supabaseInstance = {
    from: () => mockChain(),
    // Add other used methods if necessary
  };
} else {
  supabaseInstance = createClient(supabaseUrl, supabaseAnonKey);
}

export const supabase = supabaseInstance;

// Exporta a mensagem de erro específica para ser usada no contexto da aplicação.
export const supabaseInitializationError = initializationError;
