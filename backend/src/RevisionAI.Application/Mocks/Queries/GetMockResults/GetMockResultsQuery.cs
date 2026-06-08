using MediatR;

namespace RevisionAI.Application.Mocks.Queries.GetMockResults;

public class GetMockResultsQuery : IRequest<GetMockResultsResponse?>
{
    public Guid MockSessionId { get; set; }
    public Guid UserId { get; set; }
}