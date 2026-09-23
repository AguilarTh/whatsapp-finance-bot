import * as readline from "readline";
import { processarMensagemComIA } from "./ai";

export function startTerminalSimulation() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  console.log("\n--- 💻 MODO SIMULAÇÃO DE TERMINAL ATIVADO ---");
  console.log('Digite sua mensagem financeira (ou "sair" para encerrar):');

  const askQuestion = () => {
    rl.question("\n> ", async (answer) => {
      const input = answer.trim();

      if (input.toLowerCase() === "sair") {
        console.log("Encerrando simulação...");
        rl.close();
        process.exit(0);
      }

      if (input) {
        console.log(`\n🤖 Processando via Gemini...`);

        // Envia a string livre para o Gemini e recebe um Objeto Estruturado de volta
        const dadosEstruturados = await processarMensagemComIA(input);

        if (dadosEstruturados) {
          console.log("✅ Dados Extraídos com Sucesso:");
          console.dir(dadosEstruturados, { depth: null, colors: true });
        }
      }

      askQuestion();
    });
  };

  askQuestion();
}
