import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../services/api.service';
import { LancamentoPorPeriodoReturn } from '../../models/lancamento.model';

interface MesOption {
  value: number;
  label: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: false,
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit {
  lancamentos: LancamentoPorPeriodoReturn | null = null;
  recentLancamentos: LancamentoPorPeriodoReturn | null = null;

  totalReceitas = 0;
  totalDespesas = 0;
  saldoTotal = 0;
  saldoPeriodo: number | null = null;
  countLancamentos = 0;
  semLancamentos = false;
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
    this.saldoPeriodo = null;
    this.api.getLancamentos().subscribe({
      next: (res) => {
        if (!res) {
          this.semLancamentos = true;
          this.loading = false;
          return;
        }
        this.semLancamentos = false;
        this.lancamentos = res;
        this.atualizarListaExibida();
        this.calcularTotais();
        this.saldoPeriodo = res.saldoPeriodo;
        this.totalDespesas = res.totalDespesas;
        this.totalReceitas = res.totalReceitas;
        this.loading = false;
      },
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
    this.semLancamentos = false;
    this.api.getLancamentosPorPeriodo(inicio, fim).subscribe({
      next: (res) => {
        if (!res) {
          this.semLancamentos = true;
          this.loading = false;
          return;
        }
        this.lancamentos = res;
        this.saldoPeriodo = res.saldoPeriodo;
        this.atualizarListaExibida();
        this.calcularTotais();
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  private atualizarListaExibida() {
    this.recentLancamentos = this.lancamentos ? { 
      ...this.lancamentos, 
      lancamentos: this.lancamentos.lancamentos.slice(0, 8) 
    } : null;
  }

  get saldoExibido(): number {
    return this.saldoPeriodo !== null ? this.saldoPeriodo : this.saldoTotal;
  }

  private calcularTotais() {
    this.totalReceitas = this.lancamentos ? this.lancamentos.lancamentos
      .filter(l => l.tipoLancamento === 'Receita')
      .reduce((s, l) => s + l.valorLancamento, 0) : 0;

    this.totalDespesas = this.lancamentos ? this.lancamentos.lancamentos
      .filter(l => l.tipoLancamento === 'Despesa')
      .reduce((s, l) => s + l.valorLancamento, 0) : 0;

    this.saldoTotal = this.totalReceitas - this.totalDespesas;
    this.countLancamentos = this.lancamentos ? this.lancamentos.lancamentos.length : 0;
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
