using MediatR;

namespace RevisionAI.Application.Analysis.Queries.GetDashboard;

public class GetDashboardQuery : IRequest<GetDashboardResponse>
{
    public Guid UserId { get; set; }
}