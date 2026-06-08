using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Leaderboards.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Leaderboards.Queries.GetFriendsLeaderboard;

public class GetFriendsLeaderboardQueryHandler : IRequestHandler<GetFriendsLeaderboardQuery, List<LeaderboardEntryDto>>
{
    private readonly IAppDbContext _context;

    public GetFriendsLeaderboardQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<LeaderboardEntryDto>> Handle(GetFriendsLeaderboardQuery request, CancellationToken cancellationToken)
    {
        // Get accepted friend IDs (both directions — where current user is requester)
        List<Guid> friendIds = await _context.Friendships
            .AsNoTracking()
            .Where(f => f.RequesterId == request.UserId && f.Status == "Accepted")
            .Select(f => f.AddresseeId)
            .ToListAsync(cancellationToken);

        // Include the current user in the leaderboard
        friendIds.Add(request.UserId);

        if (friendIds.Count == 0)
        {
            return new List<LeaderboardEntryDto>();
        }

        // Get user profiles
        Dictionary<Guid, User> userMap = await _context.Users
            .AsNoTracking()
            .Where(u => friendIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        // Get XP entries ordered by TotalXp descending
        List<UserXp> xpEntries = await _context.UserXp
            .AsNoTracking()
            .Where(xp => friendIds.Contains(xp.UserId))
            .OrderByDescending(xp => xp.TotalXp)
            .ToListAsync(cancellationToken);

        int rank = 1;
        List<LeaderboardEntryDto> leaderboard = new();

        foreach (UserXp xp in xpEntries)
        {
            if (userMap.TryGetValue(xp.UserId, out User? user))
            {
                leaderboard.Add(new LeaderboardEntryDto
                {
                    Rank = rank++,
                    UserId = xp.UserId,
                    DisplayName = user.DisplayName,
                    TotalXp = xp.TotalXp,
                    CurrentLevel = xp.CurrentLevel
                });
            }
        }

        return leaderboard;
    }
}