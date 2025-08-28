import { createClient } from '@supabase/supabase-js';

// As chaves do Supabase devem ser configuradas como variáveis de ambiente no seu projeto Vercel.
// Nome da variável: SUPABASE_URL, Valor: [URL do seu projeto Supabase]
// Nome da variável: SUPABASE_KEY, Valor: [Sua chave anon public do Supabase]
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseAnonKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  // Este erro será visível nos logs do Vercel ou no console do navegador se as variáveis não estiverem configuradas.
  // O app não conseguirá se conectar ao banco de dados.
  console.error("Variáveis de ambiente do Supabase (SUPABASE_URL, SUPABASE_KEY) não estão configuradas.");
}

// O '!' assume que as variáveis de ambiente existirão no ambiente de produção (Vercel).
// Em um ambiente de desenvolvimento local, você precisaria de um arquivo .env ou similar.
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!);
