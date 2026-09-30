using Financeiro.Api.Data.Context;
using Financeiro.Api.Data.Models;
using Financeiro.Api.DTOs;
using Financeiro.Api.ReturnValue;
using Microsoft.AspNetCore.Mvc;
using System.Text.RegularExpressions;

namespace Financeiro.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class CategoriasController(AppDbContext context) : Controller
    {
        private static readonly Regex CorRegex = new(@"^#[0-9A-Fa-f]{6}$", RegexOptions.Compiled);

        private readonly AppDbContext _context = context;

        [HttpGet]
        public ActionResult GetCategorias()
        {
            var categorias = _context.Categorias
                .OrderBy(c => c.Nome)
                .Select(c => new CategoriaResponse
                {
                    Id = c.Id,
                    Nome = c.Nome,
                    Icone = c.Icone,
                    Cor = c.Cor,
                    QuantidadeLancamentos = c.Lancamentos.Count
                })
                .ToList();

            return Ok(categorias);
        }

        [HttpPost]
        public ActionResult InsereCategoria([FromBody] CategoriaDTO categoriaDTO)
        {
            var erroValidacao = ValidarCategoria(categoriaDTO, categoriaIdIgnorada: null);
            if (erroValidacao is not null)
                return BadRequest(new { message = erroValidacao });

            var categoria = new Categoria
            {
                Nome = categoriaDTO.Nome.Trim(),
                Icone = categoriaDTO.Icone,
                Cor = categoriaDTO.Cor
            };

            _context.Categorias.Add(categoria);
            _context.SaveChanges();

            var response = new CategoriaResponse
            {
                Id = categoria.Id,
                Nome = categoria.Nome,
                Icone = categoria.Icone,
                Cor = categoria.Cor,
                QuantidadeLancamentos = 0
            };

            return CreatedAtAction(nameof(GetCategorias), new { id = categoria.Id }, response);
        }

        [HttpPut("{id}")]
        public ActionResult AtualizaCategoria(int id, [FromBody] CategoriaDTO categoriaDTO)
        {
            var categoria = _context.Categorias.FirstOrDefault(c => c.Id == id);
            if (categoria is null)
                return NotFound();

            var erroValidacao = ValidarCategoria(categoriaDTO, categoriaIdIgnorada: id);
            if (erroValidacao is not null)
                return BadRequest(new { message = erroValidacao });

            categoria.Nome = categoriaDTO.Nome.Trim();
            categoria.Icone = categoriaDTO.Icone;
            categoria.Cor = categoriaDTO.Cor;

            _context.SaveChanges();

            var response = new CategoriaResponse
            {
                Id = categoria.Id,
                Nome = categoria.Nome,
                Icone = categoria.Icone,
                Cor = categoria.Cor,
                QuantidadeLancamentos = _context.Lancamentos.Count(l => l.CategoriaId == categoria.Id)
            };

            return Ok(response);
        }

        [HttpDelete("{id}")]
        public ActionResult RemoveCategoria(int id)
        {
            var categoria = _context.Categorias.FirstOrDefault(c => c.Id == id);
            if (categoria is null)
                return NotFound();

            var lancamentosVinculados = _context.Lancamentos.Count(l => l.CategoriaId == id);
            if (lancamentosVinculados > 0)
            {
                return Conflict(new
                {
                    message = "Não é possível excluir: existem lançamentos vinculados a esta categoria.",
                    lancamentosVinculados
                });
            }

            _context.Categorias.Remove(categoria);
            _context.SaveChanges();

            return NoContent();
        }

        private string? ValidarCategoria(CategoriaDTO categoriaDTO, int? categoriaIdIgnorada)
        {
            var nome = categoriaDTO.Nome?.Trim() ?? string.Empty;

            if (string.IsNullOrEmpty(nome))
                return "Nome é obrigatório.";

            var nomeJaExiste = _context.Categorias
                .Any(c => c.Id != categoriaIdIgnorada && c.Nome.ToLower() == nome.ToLower());

            if (nomeJaExiste)
                return "Já existe uma categoria com esse nome.";

            if (string.IsNullOrEmpty(categoriaDTO.Icone))
                return "Ícone é obrigatório.";

            if (!CorRegex.IsMatch(categoriaDTO.Cor ?? string.Empty))
                return "Cor inválida.";

            return null;
        }
    }
}
