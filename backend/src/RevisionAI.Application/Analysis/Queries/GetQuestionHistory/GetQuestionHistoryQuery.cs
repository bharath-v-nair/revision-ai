using MediatR;

namespace RevisionAI.Application.Analysis.Queries.GetQuestionHistory;

public class GetQuestionHistoryQuery : IRequest<GetQuestionHistoryResponse>
{
    public Guid UserId { get; set; }
    public Guid QuestionId { get; set; }
}