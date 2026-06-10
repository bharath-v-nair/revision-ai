using MediatR;
using RevisionAI.Application.QA;

namespace RevisionAI.Application.QA.Queries.GetQuestionReport;

public class GetQuestionReportQuery : IRequest<QuestionReportDto?>
{
    public Guid UserId { get; init; }
    public Guid QuestionId { get; init; }
}
