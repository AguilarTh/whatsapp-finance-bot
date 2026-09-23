import { supabase } from "../config/supabase";

// Tipo baseado no que a IA retorna
export interface TransacaoDTO {
  data_transacao: string;
  descricao: string;
  valor: number;
  tipo: string;
  categoria: string;
  metodo_pagamento: string;
  origem: string;
  moeda_original: string;
}

export async function processarESalvarTransacao(dados: TransacaoDTO) {
  const transacoesParaSalvar: TransacaoDTO[] = [];

  // REGRA DE NEGÓCIO (1): Split Transporte Faculdade
  const isTransporteFaculdade =
    dados.categoria === "transporte_faculdade" && dados.tipo === "gasto";

  if (isTransporteFaculdade) {
    const valorMae = 13.0;

    if (dados.valor > valorMae) {
      // Divide em duas transações
      transacoesParaSalvar.push({
        ...dados,
        categoria: "mae",
        tipo: "terceiros",
        valor: valorMae,
        descricao: `${dados.descricao} (Cota Mãe)`,
      });
      transacoesParaSalvar.push({
        ...dados,
        valor: dados.valor - valorMae,
        descricao: `${dados.descricao} (Excedente)`,
      });
    } else {
      // Se foi menor ou igual a 13 -> "mae" cobre tudo
      transacoesParaSalvar.push({
        ...dados,
        categoria: "mae",
        tipo: "terceiros",
        descricao: `${dados.descricao} (Cota Mãe Integral)`,
      });
    }
  } else {
    // Transação normal
    transacoesParaSalvar.push(dados);
  }

  // Persistência no Supabase
  try {
    const { error } = await supabase
      .from("transacoes")
      .insert(transacoesParaSalvar);

    if (error) {
      console.error("❌ Erro ao salvar no banco de dados:", error.message);
      return false;
    }

    console.log(
      `✅ ${transacoesParaSalvar.length} registro(s) salvo(s) com sucesso no Supabase!`,
    );
    return true;
  } catch (err) {
    console.error("❌ Erro inesperado na inserção:", err);
    return false;
  }
}
