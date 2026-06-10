using MediatR;

namespace RevisionAI.Application.QA.Commands.UpsertQuestionReport;

public class UpsertQuestionReportCommand : IRequest<QuestionReportDto>
{
    public Guid UserId { get; init; }
    public Guid QuestionId { get; init; }
    public string[] Issues { get; init; } = [];
    public string? Notes { get; init; }
}
