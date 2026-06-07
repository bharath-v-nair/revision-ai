using RevisionAI.Application.Questions.Queries.GetQuestions;

namespace RevisionAI.Application.HourlyQuestions.Queries.GetHourlyHistory;

public class GetHourlyHistoryResponse
{
    public List<HourlyHistoryDto> Data { get; set; } = new();
    public MetaDto Meta { get; set; } = new();
}
