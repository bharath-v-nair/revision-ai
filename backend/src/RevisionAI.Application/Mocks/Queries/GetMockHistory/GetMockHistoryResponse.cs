using RevisionAI.Application.Questions.Queries.GetQuestions;

namespace RevisionAI.Application.Mocks.Queries.GetMockHistory;

public class GetMockHistoryResponse
{
    public List<MockHistoryDto> Data { get; set; } = new();
    public MetaDto Meta { get; set; } = new();
}