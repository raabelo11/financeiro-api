import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Lancamento, CriarLancamentoPayload } from '../../models/lancamento.model';
import { Categoria, CategoriaPayload } from '../../models/categoria.model';
import { ActivatedRoute, Router } from '@angular/router';

@Component({
  selector: 'app-lancamento-form',
  standalone: false,
  templateUrl: './lancamento-form.component.html',
  styleUrls: ['./lancamento-form.component.scss']
})
export class LancamentoFormComponent implements OnInit {
  form = this.fb.group({
    nomeLancamento: [''],
    valorLancamento: [0, [Validators.required, Validators.min(0.01)]],
    selecao: ['', Validators.required]
  });

  categorias: Categoria[] = [];

  editMode = false;
  lancamentoId: number | null = null;
  loading = false;
  saving = false;
  erroSalvar: string | null = null;
  titulo = 'Novo Lancamento';
  lancamentosAdicionados: Lancamento[] = [];

  mostrarNovoTipo = false;
  novoTipoForm = this.fb.group({
    nome: ['', Validators.required],
    icone: ['category', Validators.required],
    cor: ['#4F46E5', Validators.required]
  });
  salvandoTipo = false;
  erroNovoTipo: string | null = null;

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.api.getCategorias().subscribe({
      next: (cs) => { this.categorias = cs; },
      error: () => { this.categorias = []; }
    });

    this.form.get('selecao')!.valueChanges.subscribe((selecao) => {
      this.aplicarValidacaoNome(selecao);
    });

    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam) {
      this.editMode = true;
      this.lancamentoId = Number(idParam);
      this.titulo = 'Editar Lancamento';
      this.loadLancamento(this.lancamentoId);
    }
  }

  get isReceitaSelecionada(): boolean {
    return this.form.get('selecao')?.value === 'RECEITA';
  }

  get placeholderNomeLancamento(): string {
    return this.isReceitaSelecionada
      ? 'Ex.: Salario, Rendimentos...'
      : 'Ex.: Mercado (opcional — usa o nome da categoria se vazio)';
  }

  private aplicarValidacaoNome(selecao: string | null): void {
    const nomeControl = this.form.get('nomeLancamento')!;
    if (selecao === 'RECEITA') {
      nomeControl.setValidators([Validators.required]);
    } else {
      nomeControl.clearValidators();
    }
    nomeControl.updateValueAndValidity();
  }

  selecionar(valor: string): void {
    this.form.patchValue({ selecao: valor });
  }

  isSelecionado(valor: string): boolean {
    return this.form.get('selecao')?.value === valor;
  }

  idCategoria(categoria: Categoria): string {
    return String(categoria.id);
  }

  loadLancamento(id: number) {
    this.loading = true;
    this.api.getLancamentos().subscribe({
      next: (lancamentos) => {
        const lancamento = lancamentos.lancamentos.find(l => l.id === id);
        if (lancamento) {
          const selecao = lancamento.tipoLancamento === 'Receita'
            ? 'RECEITA'
            : String(lancamento.categoriaId);
          this.form.patchValue({
            nomeLancamento: lancamento.nomeLancamento,
            valorLancamento: lancamento.valorLancamento,
            selecao
          });
          this.aplicarValidacaoNome(selecao);
        }
        this.loading = false;
      },
      error: () => { this.loading = false; }
    });
  }

  submit() {
    if (this.form.invalid) return;
    this.erroSalvar = null;
    this.saving = true;

    const { nomeLancamento, valorLancamento, selecao } = this.form.value;

    let payload: CriarLancamentoPayload;
    if (selecao === 'RECEITA') {
      const nome = (nomeLancamento ?? '').trim();
      payload = { nomeLancamento: nome, valorLancamento: valorLancamento!, tipoLancamento: 'Receita', categoriaId: null };
    } else {
      const nome = (nomeLancamento ?? '').trim();
      payload = { nomeLancamento: nome.length > 0 ? nome : null, valorLancamento: valorLancamento!, tipoLancamento: 'Despesa', categoriaId: Number(selecao) };
    }

    if (this.editMode && this.lancamentoId) {
      this.api.updateLancamento(this.lancamentoId, payload).subscribe({
        next: () => { this.saving = false; this.router.navigate(['/lancamentos']); },
        error: (err) => { this.saving = false; this.erroSalvar = err.error?.message ?? 'Erro ao salvar lançamento.'; }
      });
      return;
    }

    this.api.createLancamento(payload).subscribe({
      next: (lancamento) => {
        this.lancamentosAdicionados.unshift(lancamento);
        if (this.lancamentosAdicionados.length > 5) {
          this.lancamentosAdicionados.pop();
        }
        this.form.reset({ nomeLancamento: '', valorLancamento: 0, selecao: 'RECEITA' });
        this.aplicarValidacaoNome('RECEITA');
        this.saving = false;
      },
      error: (err) => { this.saving = false; this.erroSalvar = err.error?.message ?? 'Erro ao salvar lançamento.'; }
    });
  }

  abrirNovoTipo() {
    this.mostrarNovoTipo = true;
    this.erroNovoTipo = null;
    this.novoTipoForm.reset({ nome: '', icone: 'category', cor: '#4F46E5' });
  }

  fecharNovoTipo() {
    this.mostrarNovoTipo = false;
    this.erroNovoTipo = null;
  }

  salvarNovoTipo() {
    if (this.novoTipoForm.invalid) return;
    this.salvandoTipo = true;
    this.erroNovoTipo = null;

    this.api.createCategoria(this.novoTipoForm.value as CategoriaPayload).subscribe({
      next: (categoria) => {
        this.categorias.push(categoria);
        this.form.patchValue({ selecao: String(categoria.id) });
        this.salvandoTipo = false;
        this.mostrarNovoTipo = false;
      },
      error: (err) => {
        this.erroNovoTipo = err.error?.message ?? 'Erro ao criar tipo.';
        this.salvandoTipo = false;
      }
    });
  }

  voltar() {
    this.router.navigate(['/lancamentos']);
  }
}
