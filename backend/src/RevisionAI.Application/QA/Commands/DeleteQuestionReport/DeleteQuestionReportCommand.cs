using MediatR;

namespace RevisionAI.Application.QA.Commands.DeleteQuestionReport;

public class DeleteQuestionReportCommand : IRequest
{
    public Guid UserId { get; init; }
    public Guid QuestionId { get; init; }
}
