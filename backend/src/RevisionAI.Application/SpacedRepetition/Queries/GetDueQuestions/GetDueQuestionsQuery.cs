using MediatR;

namespace RevisionAI.Application.SpacedRepetition.Queries.GetDueQuestions;

public class GetDueQuestionsQuery : IRequest<GetDueQuestionsResponse>
{
    public Guid UserId { get; init; }
    public int Page { get; init; } = 1;
    public int PageSize { get; init; } = 20;
}