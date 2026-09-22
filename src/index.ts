import "dotenv/config";
import { supabase } from "./config/supabase";

async function bootstrap() {
  console.log("Iniciando bot financeiro...");

  // Testando a conexão com o Supabase
  const { data, error } = await supabase
    .from("transacoes")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Erro ao conectar com o Supabase:", error.message);
    return;
  }

  console.log(
    'Conexão com Supabase estabelecida com sucesso! Tabela "transacoes" acessível.',
  );
}

bootstrap();
