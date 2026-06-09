using MediatR;
using RevisionAI.Application.Gamification.Dtos;

namespace RevisionAI.Application.Gamification.Queries.GetXpSummary;

public class GetXpSummaryQuery : IRequest<XpSummaryDto>
{
    public Guid UserId { get; set; }
}