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

if (!supabaseUrl || !supabaseAnonKey) {
  // Em vez de quebrar a aplicação, exibe um erro claro no console do desenvolvedor.
  // A lógica de tratamento de erro na UI cuidará de informar o usuário.
  console.error("ERRO CRÍTICO: As variáveis de ambiente do Supabase (VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY) não estão configuradas. O app não pode se conectar ao banco de dados. Verifique a configuração do seu projeto na Vercel.");
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);