using MediatR;

namespace RevisionAI.Application.SpacedRepetition.Queries.GetSpacedRepetitionStats;

public class GetSpacedRepetitionStatsQuery : IRequest<GetSpacedRepetitionStatsResponse>
{
    public Guid UserId { get; init; }
}