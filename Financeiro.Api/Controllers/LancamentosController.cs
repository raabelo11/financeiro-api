using Financeiro.Api.Data.Context;
using Financeiro.Api.Data.Models;
using Financeiro.Api.DTOs;
using Financeiro.Api.Enums;
using Financeiro.Api.ReturnValue;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace Financeiro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LancamentosController(AppDbContext context) : Controller
    {
        private readonly AppDbContext _context = context;

        [HttpGet]
        public ActionResult GetLancamentos()
        {
            var lancamentos = _context.Lancamentos
                .Include(l => l.Categoria)
                .OrderByDescending(p => p.Id)
                .ToList();

            if (lancamentos.Count == 0)
                return NoContent();

            return Ok(MontarRetornoPorPeriodo(lancamentos));
        }

        [HttpGet("Periodo")]
        public ActionResult GetLancamentosPorPeriodo(DateOnly dataInicio, DateOnly datafim)
        {
            var lancamentos = _context.Lancamentos
                .Include(l => l.Categoria)
                .Where(p => p.DataLancamento >= dataInicio.ToDateTime(TimeOnly.MinValue) && p.DataLancamento <= datafim.ToDateTime(TimeOnly.MaxValue))
                .OrderByDescending(p => p.Id)
                .ToList();

            if (lancamentos.Count == 0)
                return NoContent();

            return Ok(MontarRetornoPorPeriodo(lancamentos));
        }

        [HttpPost]
        public ActionResult InsereLancamento([FromBody] LancamentoDTO lancamentoDTO)
        {
            var (erroValidacao, nomeResolvido) = ValidarEResolverLancamento(lancamentoDTO);
            if (erroValidacao is not null)
                return BadRequest(new { message = erroValidacao });

            var lancamento = new Lancamento
            {
                NomeLancamento = nomeResolvido,
                ValorLancamento = lancamentoDTO.ValorLancamento,
                TipoLancamento = lancamentoDTO.TipoLancamento,
                CategoriaId = lancamentoDTO.CategoriaId,
                DataLancamento = DateTime.Now.Date
            };

            _context.Lancamentos.Add(lancamento);
            _context.SaveChanges();

            var response = CarregarResponse(lancamento.Id);

            return CreatedAtAction(nameof(GetLancamentos), new { id = lancamento.Id }, response);
        }

        [HttpPut("{id}")]
        public ActionResult AtualizaLancamento(int id, [FromBody] LancamentoDTO lancamentoDTO)
        {
            var lancamento = _context.Lancamentos.FirstOrDefault(l => l.Id == id);
            if (lancamento is null)
                return NotFound();

            var (erroValidacao, nomeResolvido) = ValidarEResolverLancamento(lancamentoDTO);
            if (erroValidacao is not null)
                return BadRequest(new { message = erroValidacao });

            lancamento.NomeLancamento = nomeResolvido;
            lancamento.ValorLancamento = lancamentoDTO.ValorLancamento;
            lancamento.TipoLancamento = lancamentoDTO.TipoLancamento;
            lancamento.CategoriaId = lancamentoDTO.CategoriaId;

            _context.SaveChanges();

            var response = CarregarResponse(lancamento.Id);

            return Ok(response);
        }

        [HttpDelete("{id}")]
        public ActionResult RemoveLancamento(int id)
        {
            var lancamento = _context.Lancamentos.FirstOrDefault(l => l.Id == id);
            if (lancamento is null)
                return NotFound();

            _context.Lancamentos.Remove(lancamento);
            _context.SaveChanges();

            return NoContent();
        }

        private (string? Erro, string Nome) ValidarEResolverLancamento(LancamentoDTO lancamentoDTO)
        {
            var erroTipo = ValidarTipoLancamento(lancamentoDTO);
            if (erroTipo is not null)
                return (erroTipo, string.Empty);

            var erroValor = ValidarValorLancamento(lancamentoDTO);
            if (erroValor is not null)
                return (erroValor, string.Empty);

            var (erroCategoria, categoria) = ValidarCategoriaLancamento(lancamentoDTO);
            if (erroCategoria is not null)
                return (erroCategoria, string.Empty);

            if (lancamentoDTO.TipoLancamento == TipoLancamento.Receita)
            {
                var erroNome = ValidarNomeReceita(lancamentoDTO);
                if (erroNome is not null)
                    return (erroNome, string.Empty);

                return (null, lancamentoDTO.NomeLancamento!.Trim());
            }

            return (null, ResolverNomeDespesa(lancamentoDTO.NomeLancamento, categoria!));
        }

        private static string? ValidarTipoLancamento(LancamentoDTO lancamentoDTO)
        {
            if (!Enum.IsDefined(typeof(TipoLancamento), lancamentoDTO.TipoLancamento))
                return "TipoLancamento inválido.";

            return null;
        }

        private static string? ValidarValorLancamento(LancamentoDTO lancamentoDTO)
        {
            if (lancamentoDTO.ValorLancamento <= 0)
                return "Valor deve ser maior que zero.";

            return null;
        }

        private (string? Erro, Categoria? Categoria) ValidarCategoriaLancamento(LancamentoDTO lancamentoDTO)
        {
            if (lancamentoDTO.TipoLancamento == TipoLancamento.Receita)
            {
                if (lancamentoDTO.CategoriaId != null)
                    return ("Receita não pode ter categoria.", null);

                return (null, null);
            }

            if (lancamentoDTO.CategoriaId == null)
                return ("Despesa exige uma categoria.", null);

            var categoria = _context.Categorias.FirstOrDefault(c => c.Id == lancamentoDTO.CategoriaId);
            if (categoria is null)
                return ("Categoria informada não existe.", null);

            return (null, categoria);
        }

        private static string? ValidarNomeReceita(LancamentoDTO lancamentoDTO)
        {
            if (string.IsNullOrWhiteSpace(lancamentoDTO.NomeLancamento))
                return "Nome do lançamento é obrigatório.";

            return null;
        }

        private static string ResolverNomeDespesa(string? nomeInformado, Categoria categoria)
        {
            if (!string.IsNullOrWhiteSpace(nomeInformado))
                return nomeInformado.Trim();

            return categoria.Nome;
        }

        private LancamentoResponse CarregarResponse(int id)
        {
            var lancamento = _context.Lancamentos
                .Include(l => l.Categoria)
                .First(l => l.Id == id);

            return MapearParaResponse(lancamento);
        }

        private LancamentoPorPeriodoReturnValue MontarRetornoPorPeriodo(List<Lancamento> lancamentos)
        {
            var despesas = lancamentos.Where(p => p.TipoLancamento == TipoLancamento.Despesa).Sum(p => p.ValorLancamento);
            var receitas = lancamentos.Where(p => p.TipoLancamento == TipoLancamento.Receita).Sum(p => p.ValorLancamento);

            return new LancamentoPorPeriodoReturnValue
            {
                Lancamentos = lancamentos.Select(MapearParaResponse).ToList(),
                SaldoPeriodo = receitas - despesas,
                TotalReceitas = receitas,
                TotalDespesas = despesas
            };
        }

        private static LancamentoResponse MapearParaResponse(Lancamento l)
        {
            return new LancamentoResponse
            {
                Id = l.Id,
                NomeLancamento = l.NomeLancamento,
                ValorLancamento = l.ValorLancamento,
                TipoLancamento = l.TipoLancamento,
                DataLancamento = l.DataLancamento,
                CategoriaId = l.CategoriaId,
                CategoriaNome = l.Categoria?.Nome,
                CategoriaIcone = l.Categoria?.Icone,
                CategoriaCor = l.Categoria?.Cor
            };
        }
    }
}
