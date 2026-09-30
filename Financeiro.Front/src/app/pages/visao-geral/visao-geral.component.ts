import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LancamentoPorPeriodoReturn } from '../../models/lancamento.model';

interface MesOption {
  value: number;
  label: string;
}

interface CategoriaCard {
  categoriaId: number;
  nome: string;
  icone: string;
  cor: string;
  total: number;
  count: number;
  percentual: number;
}

@Component({
  selector: 'app-visao-geral',
  standalone: false,
  templateUrl: './visao-geral.component.html',
  styleUrls: ['./visao-geral.component.scss']
})
export class VisaoGeralComponent implements OnInit {
  loading = false;
  periodoAtivo = 'todos';

  mesSelecionado!: number;
  anoSelecionado!: number;

  meses: MesOption[] = [
    { value: 1, label: 'Janeiro' },
    { value: 2, label: 'Fevereiro' },
    { value: 3, label: 'Marco' },
    { value: 4, label: 'Abril' },
    { value: 5, label: 'Maio' },
    { value: 6, label: 'Junho' },
    { value: 7, label: 'Julho' },
    { value: 8, label: 'Agosto' },
    { value: 9, label: 'Setembro' },
    { value: 10, label: 'Outubro' },
    { value: 11, label: 'Novembro' },
    { value: 12, label: 'Dezembro' }
  ];

  anos: number[] = [];

  cards: CategoriaCard[] = [];
  totalDespesas = 0;
  topCategoriaId: number | null = null;
  semDados = false;

  constructor(private api: ApiService) { }

  ngOnInit(): void {
    const hoje = new Date();
    this.mesSelecionado = hoje.getMonth() + 1;
    this.anoSelecionado = hoje.getFullYear();
    this.anos = this.gerarUltimosAnos(hoje.getFullYear());

    this.load();
  }

  load() {
    this.loading = true;
    this.api.getLancamentos().subscribe({
      next: (res) => { this.aggregate(res); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  selecionarPeriodo(periodo: string) {
    this.periodoAtivo = periodo;

    if (periodo === 'todos') {
      this.load();
      return;
    }

    const hoje = new Date();
    let dataInicio: Date;
    let dataFim: Date;

    if (periodo === 'mes_atual') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth(), 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth() + 1, 0);
    } else if (periodo === 'mes_anterior') {
      dataInicio = new Date(hoje.getFullYear(), hoje.getMonth() - 1, 1);
      dataFim = new Date(hoje.getFullYear(), hoje.getMonth(), 0);
    } else {
      dataInicio = new Date(hoje.getFullYear(), 0, 1);
      dataFim = new Date(hoje.getFullYear(), 11, 31);
    }

    this.buscarPorPeriodo(dataInicio, dataFim);
  }

  filtrarPorMesAno() {
    this.periodoAtivo = '';
    const dataInicio = new Date(this.anoSelecionado, this.mesSelecionado - 1, 1);
    const dataFim = new Date(this.anoSelecionado, this.mesSelecionado, 0);
    this.buscarPorPeriodo(dataInicio, dataFim);
  }

  private buscarPorPeriodo(dataInicio: Date, dataFim: Date) {
    this.loading = true;
    const inicio = this.formatarData(dataInicio);
    const fim = this.formatarData(dataFim);
    this.api.getLancamentosPorPeriodo(inicio, fim).subscribe({
      next: (res) => { this.aggregate(res); this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  private aggregate(res: LancamentoPorPeriodoReturn | null) {
    if (!res || !res.lancamentos || res.lancamentos.length === 0) {
      this.cards = [];
      this.totalDespesas = 0;
      this.semDados = true;
      this.topCategoriaId = null;
      return;
    }

    const despesas = res.lancamentos.filter(l => l.tipoLancamento === 'Despesa');

    const grupos = new Map<number, CategoriaCard>();

    for (const l of despesas) {
      const categoriaId = l.categoriaId ?? 0;
      let grupo = grupos.get(categoriaId);
      if (!grupo) {
        grupo = {
          categoriaId,
          nome: l.categoriaNome ?? 'Outros',
          icone: l.categoriaIcone ?? 'category',
          cor: l.categoriaCor ?? '#64748B',
          total: 0,
          count: 0,
          percentual: 0
        };
        grupos.set(categoriaId, grupo);
      }
      grupo.total += l.valorLancamento;
      grupo.count += 1;
    }

    const cards = Array.from(grupos.values()).filter(g => g.count > 0 && g.total !== 0);
    this.totalDespesas = cards.reduce((s, c) => s + c.total, 0);

    for (const c of cards) {
      c.percentual = this.totalDespesas > 0 ? (c.total / this.totalDespesas) * 100 : 0;
    }

    cards.sort((a, b) => b.total - a.total);

    this.cards = cards;
    this.semDados = cards.length === 0;
    this.topCategoriaId = cards.length > 0 ? cards[0].categoriaId : null;
  }

  get donutGradient(): string {
    if (!this.cards.length) {
      return 'conic-gradient(var(--border) 0% 100%)';
    }
    let acc = 0;
    const stops = this.cards.map(c => {
      const start = acc;
      acc += c.percentual;
      return `${c.cor} ${start}% ${acc}%`;
    });
    return `conic-gradient(${stops.join(', ')})`;
  }

  private gerarUltimosAnos(anoAtual: number): number[] {
    const anos: number[] = [];
    for (let i = 0; i < 5; i++) {
      anos.push(anoAtual - i);
    }
    return anos;
  }

  private formatarData(data: Date): string {
    const ano = data.getFullYear();
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    return `${ano}-${mes}-${dia}`;
  }
}
