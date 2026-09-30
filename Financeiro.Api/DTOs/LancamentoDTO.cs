using Financeiro.Api.Enums;

namespace Financeiro.Api.DTOs
{
    public class LancamentoDTO
    {
        public string? NomeLancamento { get; set; }
        public decimal ValorLancamento { get; set; }
        public TipoLancamento TipoLancamento { get; set; }
        public int? CategoriaId { get; set; }
    }
}
