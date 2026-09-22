import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// Recupera as variáveis de ambiente necessárias para a conexão
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

// Validação defensiva: impede a inicialização do app caso as credenciais estejam ausentes
if (!supabaseUrl || !supabaseKey) {
  throw new Error(
    "As variáveis de ambiente SUPABASE_URL e SUPABASE_KEY devem estar preenchidas.",
  );
}

// Inicializa e exporta o cliente do Supabase
export const supabase = createClient(supabaseUrl, supabaseKey);
