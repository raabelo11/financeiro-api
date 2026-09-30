export interface Lancamento {
  id?: number;
  nomeLancamento: string;
  valorLancamento: number;
  tipoLancamento: 'Receita' | 'Despesa';
  dataLancamento?: string;
  categoriaId?: number | null;
  categoriaNome?: string | null;
  categoriaIcone?: string | null;
  categoriaCor?: string | null;
}

export interface CriarLancamentoPayload {
  nomeLancamento: string | null;
  valorLancamento: number;
  tipoLancamento: 'Receita' | 'Despesa';
  categoriaId?: number | null;
}

export interface LancamentoPorPeriodoReturn {
  lancamentos: Lancamento[];
  saldoPeriodo: number;
  totalReceitas: number;
  totalDespesas: number;
}
