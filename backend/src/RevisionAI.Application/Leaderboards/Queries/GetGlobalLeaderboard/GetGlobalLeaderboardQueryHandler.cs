using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Leaderboards.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Leaderboards.Queries.GetGlobalLeaderboard;

public class GetGlobalLeaderboardQueryHandler : IRequestHandler<GetGlobalLeaderboardQuery, List<LeaderboardEntryDto>>
{
    private readonly IAppDbContext _context;

    public GetGlobalLeaderboardQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<LeaderboardEntryDto>> Handle(GetGlobalLeaderboardQuery request, CancellationToken cancellationToken)
    {
        int skip = (request.Page - 1) * request.PageSize;

        List<UserXp> xpEntries = await _context.UserXp
            .AsNoTracking()
            .OrderByDescending(xp => xp.TotalXp)
            .Skip(skip)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        if (xpEntries.Count == 0)
        {
            return new List<LeaderboardEntryDto>();
        }

        var userIds = xpEntries.Select(xp => xp.UserId).ToList();

        Dictionary<Guid, User> userMap = await _context.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        int startRank = skip + 1;
        List<LeaderboardEntryDto> leaderboard = new();

        for (int i = 0; i < xpEntries.Count; i++)
        {
            UserXp xp = xpEntries[i];
            if (userMap.TryGetValue(xp.UserId, out User? user))
            {
                leaderboard.Add(new LeaderboardEntryDto
                {
                    Rank = startRank + i,
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