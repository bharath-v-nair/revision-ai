using MediatR;
using RevisionAI.Application.Leaderboards.Dtos;

namespace RevisionAI.Application.Leaderboards.Queries.GetFriendsLeaderboard;

public class GetFriendsLeaderboardQuery : IRequest<List<LeaderboardEntryDto>>
{
    public Guid UserId { get; set; }
}