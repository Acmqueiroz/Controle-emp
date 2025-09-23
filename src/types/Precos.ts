export interface PrecoProduto {
  nome: string;
  tipo: 'EMPADÃO' | 'EMPADA';
  precoUnidade: number;
  precoCaixa: number;
  variacao: number;
  variacaoTipo: 'aumento' | 'diminuicao' | 'sem_mudanca';
}

export interface Venda {
  id: string;
  data: Date;
  sabor: string;
  tipo: 'EMPADÃO' | 'EMPADA';
  quantidade: number;
  precoUnidade: number;
  precoTotal: number;
  cliente?: string;
  formaPagamento: 'dinheiro' | 'cartao' | 'pix' | 'transferencia';
}

export interface Pedido {
  id: string;
  data: Date;
  sabor: string;
  tipo: 'EMPADÃO' | 'EMPADA';
  quantidade: number;
  precoUnidade: number;
  precoTotal: number;
  fornecedor?: string;
  status: 'pendente' | 'entregue' | 'cancelado';
}

export interface RelatorioMensal {
  mes: number;
  ano: number;
  totalVendas: number;
  totalPedidos: number;
  totalPagamentos: number;
  lucroBruto: number;
  lucroLiquido: number;
  saboresMaisVendidos: Array<{
    sabor: string;
    quantidade: number;
    valor: number;
  }>;
  vendasPorDia: Array<{
    dia: number;
    vendas: number;
    pedidos: number;
  }>;
}

export interface RelatorioSemanal {
  semana: number;
  mes: number;
  ano: number;
  totalVendas: number;
  totalPedidos: number;
  totalPagamentos: number;
  lucroBruto: number;
  saboresMaisVendidos: Array<{
    sabor: string;
    quantidade: number;
    valor: number;
  }>;
  comparacaoSemanaAnterior: {
    vendas: number;
    pedidos: number;
    lucro: number;
  };
}

export interface DashboardAnalytics {
  vendasHoje: number;
  vendasMes: number;
  vendasAno: number;
  lucroMes: number;
  saboresTop5: Array<{
    sabor: string;
    quantidade: number;
    valor: number;
  }>;
  tendencias: {
    crescimentoVendas: number;
    crescimentoLucro: number;
  };
  alertas: Array<{
    tipo: 'estoque_baixo' | 'lucro_baixo' | 'vendas_baixas';
    mensagem: string;
    prioridade: 'alta' | 'media' | 'baixa';
  }>;
}
