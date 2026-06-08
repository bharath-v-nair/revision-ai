using MediatR;

namespace RevisionAI.Application.Mocks.Queries.GetMockHistory;

public class GetMockHistoryQuery : IRequest<GetMockHistoryResponse>
{
    public Guid UserId { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
}