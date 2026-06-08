using MediatR;

namespace RevisionAI.Application.Analysis.Commands.AnalyzeBatch;

public class AnalyzeBatchCommand : IRequest<AnalyzeBatchResponse>
{
    public Guid UserId { get; set; }
    public List<Guid> QuestionIds { get; set; } = new();
}