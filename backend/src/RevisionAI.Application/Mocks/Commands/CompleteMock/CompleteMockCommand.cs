using MediatR;

namespace RevisionAI.Application.Mocks.Commands.CompleteMock;

public class CompleteMockCommand : IRequest<CompleteMockResponse>
{
    public Guid MockSessionId { get; set; }
    public Guid UserId { get; set; }
}