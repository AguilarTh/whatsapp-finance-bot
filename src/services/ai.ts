import {
  GoogleGenerativeAI,
  Schema,
  SchemaType as Type,
} from "@google/generative-ai";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import "dotenv/config";

// Configuração de fuso horário
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.tz.setDefault("America/Sao_Paulo");

const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  throw new Error("GEMINI_API_KEY não configurada.");
}

const genAI = new GoogleGenerativeAI(apiKey);

// Trava de categorias
export const CATEGORIAS_PERMITIDAS = [
  "alimentacao",
  "alimentacao_faculdade",
  "bebida",
  "transporte",
  "transporte_faculdade",
  "saude",
  "festa",
  "lazer",
  "streaming",
  "barbearia",
  "compras_gerais",
  "vestuario",
  "educacao",
  "mae",
  "investimento",
  "outros",
  "salario",
  "freelancer",
  "renda_extra",
];

// Trava de métodos de pagamento
export const METODOS_PAGAMENTO_PERMITIDOS = [
  "credito_nubank",
  "credito_inter",
  "credito_outros",
  "dinheiro",
  "pix",
  "debito",
];

const transacaoSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    data_transacao: {
      type: Type.STRING,
      description:
        "Data no formato YYYY-MM-DD. Baseie-se no contexto injetado.",
    },
    descricao: {
      type: Type.STRING,
      description: "Resumo curto da transação.",
    },
    valor: { type: Type.NUMBER, description: "Valor monetário absoluto." },
    tipo: {
      type: Type.STRING,
      format: "enum",
      description:
        "Regra Crítica: Se a categoria for 'mae', o tipo DEVE ser obrigatoriamente 'terceiros'. Caso contrário, use 'gasto' ou 'recebimento'.",
      enum: ["gasto", "recebimento", "terceiros"],
    },
    categoria: {
      type: Type.STRING,
      format: "enum",
      description:
        "Regra: Se tipo for 'gasto', escolha entre: alimentacao, alimentacao_faculdade, bebida, transporte, transporte_faculdade, saude, festa, lazer, streaming, barbearia, compras_gerais, vestuario, educacao, mae, investimento, outros. Se tipo for 'recebimento', escolha entre: salario, freelancer, renda_extra.",
      enum: CATEGORIAS_PERMITIDAS,
    },
    metodo_pagamento: {
      type: Type.STRING,
      format: "enum",
      description:
        "Método de pagamento. Regras: 1) Se o usuário disser apenas 'crédito' sem especificar a instituição, assuma OBRIGATORIAMENTE 'credito_inter' como padrão. 2) Só classifique como 'credito_nubank' ou 'credito_outros' se for explicitamente mencionado.",
      enum: METODOS_PAGAMENTO_PERMITIDOS,
    },
    origem: {
      type: Type.STRING,
      description:
        "Origem ou detalhe de rastreabilidade (ex: unidade do Bernoulli 'Lourdes' ou 'CDM', nome da loja, etc). Se não for aplicável ou não mencionado, retorne uma string vazia ''.",
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
    "origem",
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
    "Você é um assistente financeiro robótico. Extraia os dados e converta rigorosamente para o JSON exigido. Regras Críticas: 1) Se o usuário NÃO explicitar o valor numérico, defina 'valor' como 0. 2) Siga rigorosamente as instruções de 'categoria' baseando-se no 'tipo'.",
});

export async function processarMensagemComIA(mensagem: string, tentativas = 3) {
  const dataAtual = dayjs().tz("America/Sao_Paulo").format("YYYY-MM-DD");
  const promptComContexto = `[CONTEXTO DO SISTEMA]: A data de hoje é ${dataAtual}.\n[MENSAGEM DO USUÁRIO]: ${mensagem}`;

  for (let i = 1; i <= tentativas; i++) {
    try {
      const result = await model.generateContent(promptComContexto);
      const responseText = result.response.text();
      return JSON.parse(responseText);
    } catch (error: any) {
      const status = error?.status || error?.response?.status;
      if (status === 503 && i < tentativas) {
        console.warn(
          `⏳ [Tentativa ${i}/${tentativas}] API sobrecarregada (503). Tentando novamente em 2 segundos...`,
        );
        await new Promise((resolve) => setTimeout(resolve, 2000));
        continue;
      }
      console.error("❌ Erro fatal ao processar mensagem na IA:", error);
      return null;
    }
  }
}
