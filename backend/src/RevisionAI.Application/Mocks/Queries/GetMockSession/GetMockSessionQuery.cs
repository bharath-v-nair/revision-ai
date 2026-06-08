using MediatR;

namespace RevisionAI.Application.Mocks.Queries.GetMockSession;

public class GetMockSessionQuery : IRequest<GetMockSessionResponse?>
{
    public Guid MockSessionId { get; set; }
    public Guid UserId { get; set; }
}