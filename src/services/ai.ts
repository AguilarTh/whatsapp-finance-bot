import {
  GoogleGenerativeAI,
  Schema,
  SchemaType as Type,
} from "@google/generative-ai";
import "dotenv/config";

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY não configurada.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Definindo o contrato de dados (Schema) baseado na nossa tabela do Supabase
const transacaoSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    data_transacao: {
      type: Type.STRING,
      description:
        "Data do gasto no formato YYYY-MM-DD. Se hoje, use a data atual. Se não especificado, deduza pelo contexto.",
    },
    descricao: {
      type: Type.STRING,
      description: "Resumo do que foi comprado ou recebido.",
    },
    valor: {
      type: Type.NUMBER,
      description: "Valor monetário absoluto (apenas o número, ex: 15.50).",
    },
    tipo: {
      type: Type.STRING,
      description: "Exatamente 'gasto' ou 'recebimento'.",
    },
    categoria: {
      type: Type.STRING,
      description:
        "Categoria curta e sem espaços (ex: alimentacao, transporte, uber_faculdade).",
    },
    metodo_pagamento: {
      type: Type.STRING,
      description: "Ex: pix, cartao_credito, dinheiro.",
    },
    moeda_original: {
      type: Type.STRING,
      description: "Código ISO de 3 letras (ex: BRL, USD).",
    },
  },
  required: [
    "data_transacao",
    "descricao",
    "valor",
    "tipo",
    "categoria",
    "metodo_pagamento",
    "moeda_original",
  ],
};

const model = genAI.getGenerativeModel({
  model: "gemini-3.5-flash-lite",
  generationConfig: {
    responseMimeType: "application/json",
    responseSchema: transacaoSchema,
  },
  systemInstruction:
    "Você é um assistente financeiro robótico. O usuário atual enviará mensagens informais de gastos. Extraia os dados e converta rigorosamente para o formato JSON exigido, deduzindo os campos vazios da melhor forma possível.",
});

export async function processarMensagemComIA(mensagem: string, tentativas = 3) {
  for (let i = 1; i <= tentativas; i++) {
    try {
      const result = await model.generateContent(mensagem);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error: any) {
      const status = error?.status || error?.response?.status;

      // Se for um erro 503 (Servidor indisponível) e ainda tivermos tentativas
      if (status === 503 && i < tentativas) {
        console.warn(
          `[Tentativa ${i}/${tentativas}] API do Google sobrecarregada (503). Tentando novamente em 2 segundos...`,
        );
        // Espera 2000ms (2 segundos) antes da próxima iteração do loop
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }

      console.error("Erro fatal ao processar mensagem na IA:", error);
      return null;
    }
  }
}
