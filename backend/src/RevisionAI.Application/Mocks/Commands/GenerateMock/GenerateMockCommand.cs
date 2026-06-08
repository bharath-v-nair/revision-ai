using MediatR;

namespace RevisionAI.Application.Mocks.Commands.GenerateMock;

public class GenerateMockCommand : IRequest<GenerateMockResponse>
{
    public Guid UserId { get; set; }
    public List<Guid> SubjectIds { get; set; } = new();
    public int QuestionCount { get; set; }
    public int? TimeLimitMinutes { get; set; }
}