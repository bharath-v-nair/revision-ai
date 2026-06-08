using MediatR;
using RevisionAI.Application.Mocks.Commands.GenerateMock;

namespace RevisionAI.Application.Mocks.Commands.RetakeIncorrect;

public class RetakeIncorrectCommand : IRequest<GenerateMockResponse>
{
    public Guid PreviousMockSessionId { get; set; }
    public Guid UserId { get; set; }
}