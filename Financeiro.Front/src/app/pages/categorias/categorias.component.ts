import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { Categoria, CategoriaPayload } from '../../models/categoria.model';

interface IconeOption {
  valor: string;
  rotulo: string;
}

interface CorOption {
  valor: string;
  rotulo: string;
}

@Component({
  selector: 'app-categorias',
  standalone: false,
  templateUrl: './categorias.component.html',
  styleUrls: ['./categorias.component.scss']
})
export class CategoriasComponent implements OnInit {
  categorias: Categoria[] = [];
  loading = false;

  mostrarModal = false;
  editando: Categoria | null = null;
  salvando = false;
  erroForm: string | null = null;

  readonly icones: IconeOption[] = [
    { valor: 'category', rotulo: 'Geral' },
    { valor: 'restaurant', rotulo: 'Alimentação' },
    { valor: 'shopping_cart', rotulo: 'Mercado' },
    { valor: 'directions_car', rotulo: 'Transporte' },
    { valor: 'home', rotulo: 'Moradia' },
    { valor: 'health_and_safety', rotulo: 'Saúde' },
    { valor: 'school', rotulo: 'Educação' },
    { valor: 'sports_esports', rotulo: 'Lazer' },
    { valor: 'receipt_long', rotulo: 'Contas' },
    { valor: 'work', rotulo: 'Trabalho' },
    { valor: 'pets', rotulo: 'Pets' },
    { valor: 'flight', rotulo: 'Viagem' }
  ];

  readonly cores: CorOption[] = [
    { valor: '#4F46E5', rotulo: 'Índigo' },
    { valor: '#2563EB', rotulo: 'Azul' },
    { valor: '#0891B2', rotulo: 'Ciano' },
    { valor: '#059669', rotulo: 'Verde' },
    { valor: '#65A30D', rotulo: 'Lima' },
    { valor: '#D97706', rotulo: 'Âmbar' },
    { valor: '#EA580C', rotulo: 'Laranja' },
    { valor: '#DC2626', rotulo: 'Vermelho' },
    { valor: '#DB2777', rotulo: 'Rosa' },
    { valor: '#9333EA', rotulo: 'Roxo' },
    { valor: '#475569', rotulo: 'Ardósia' },
    { valor: '#0F766E', rotulo: 'Turquesa' }
  ];

  form = this.fb.group({
    nome: ['', Validators.required],
    icone: ['category', Validators.required],
    cor: ['#4F46E5', Validators.required]
  });

  mostrarModalExcluir = false;
  categoriaParaExcluir: Categoria | null = null;
  excluindo = false;
  erroExcluir: string | null = null;

  constructor(private api: ApiService, private fb: FormBuilder) { }

  ngOnInit(): void {
    this.load();
  }

  load() {
    this.loading = true;
    this.api.getCategorias().subscribe({
      next: (cs) => { this.categorias = cs; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  abrirNova() {
    this.editando = null;
    this.erroForm = null;
    this.form.reset({ nome: '', icone: 'category', cor: '#4F46E5' });
    this.mostrarModal = true;
  }

  abrirEdicao(c: Categoria) {
    this.editando = c;
    this.erroForm = null;
    this.form.patchValue({ nome: c.nome, icone: c.icone, cor: c.cor });
    this.mostrarModal = true;
  }

  fecharModal() {
    this.mostrarModal = false;
    this.editando = null;
  }

  salvar() {
    if (this.form.invalid) return;
    this.salvando = true;
    this.erroForm = null;

    const payload = this.form.value as CategoriaPayload;

    if (this.editando) {
      this.api.updateCategoria(this.editando.id, payload).subscribe({
        next: () => { this.salvando = false; this.fecharModal(); this.load(); },
        error: (err) => {
          this.salvando = false;
          this.erroForm = err.error?.message ?? 'Erro ao salvar categoria.';
        }
      });
      return;
    }

    this.api.createCategoria(payload).subscribe({
      next: () => { this.salvando = false; this.fecharModal(); this.load(); },
      error: (err) => {
        this.salvando = false;
        this.erroForm = err.error?.message ?? 'Erro ao salvar categoria.';
      }
    });
  }

  confirmarExclusao(c: Categoria) {
    this.categoriaParaExcluir = c;
    this.erroExcluir = null;
    this.mostrarModalExcluir = true;
  }

  cancelarExclusao() {
    this.mostrarModalExcluir = false;
    this.categoriaParaExcluir = null;
  }

  excluir() {
    if (!this.categoriaParaExcluir) return;
    this.excluindo = true;
    this.erroExcluir = null;

    this.api.deleteCategoria(this.categoriaParaExcluir.id).subscribe({
      next: () => {
        this.excluindo = false;
        this.mostrarModalExcluir = false;
        this.categoriaParaExcluir = null;
        this.load();
      },
      error: (err) => {
        this.excluindo = false;
        this.erroExcluir = err.error?.message ?? 'Não foi possível excluir.';
      }
    });
  }
}
