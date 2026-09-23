import "dotenv/config";
import { supabase } from "./config/supabase";
// import { connectToWhatsApp } from './services/whatsapp'; // Pausado temporariamente
import { startTerminalSimulation } from "./services/terminal";

async function bootstrap() {
  console.log("Iniciando bot financeiro...");

  // Teste de conexão com o banco
  const { error } = await supabase.from("transacoes").select("*").limit(1);
  if (error) {
    console.error("❌ Erro no Supabase:", error.message);
    return;
  }
  console.log("✅ Banco de dados OK!");

  // Iniciar a conexão WebSocket do WhatsApp (Pausado)
  // await connectToWhatsApp();

  // Iniciar interface de simulação
  startTerminalSimulation();
}

bootstrap();
