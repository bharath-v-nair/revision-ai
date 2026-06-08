using MediatR;
using RevisionAI.Application.Leaderboards.Dtos;

namespace RevisionAI.Application.Leaderboards.Queries.GetWeeklyLeaderboard;

public class GetWeeklyLeaderboardQuery : IRequest<List<LeaderboardEntryDto>>
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 50;
}