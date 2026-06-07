using MediatR;

namespace RevisionAI.Application.HourlyQuestions.Queries.GetPendingQuestions;

public class GetPendingQuestionsQuery : IRequest<GetPendingQuestionsResponse>
{
    public Guid UserId { get; set; }
}