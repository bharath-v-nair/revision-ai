using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Leaderboards.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Leaderboards.Queries.GetWeeklyLeaderboard;

public class GetWeeklyLeaderboardQueryHandler : IRequestHandler<GetWeeklyLeaderboardQuery, List<LeaderboardEntryDto>>
{
    private readonly IAppDbContext _context;

    public GetWeeklyLeaderboardQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<LeaderboardEntryDto>> Handle(GetWeeklyLeaderboardQuery request, CancellationToken cancellationToken)
    {
        // Calculate Monday 00:00 UTC of the current week
        DateTime now = DateTime.UtcNow;
        int daysSinceMonday = ((int)now.DayOfWeek - (int)DayOfWeek.Monday + 7) % 7;
        DateTime weekStart = now.Date.AddDays(-daysSinceMonday);

        // Group by UserId, sum XP amounts since Monday
        var weeklyXp = await _context.XpTransactions
            .AsNoTracking()
            .Where(t => t.CreatedAt >= weekStart)
            .GroupBy(t => t.UserId)
            .Select(g => new
            {
                UserId = g.Key,
                TotalXp = g.Sum(t => t.Amount)
            })
            .OrderByDescending(x => x.TotalXp)
            .Skip((request.Page - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync(cancellationToken);

        if (weeklyXp.Count == 0)
        {
            return new List<LeaderboardEntryDto>();
        }

        var userIds = weeklyXp.Select(x => x.UserId).ToList();

        Dictionary<Guid, User> userMap = await _context.Users
            .AsNoTracking()
            .Where(u => userIds.Contains(u.Id))
            .ToDictionaryAsync(u => u.Id, cancellationToken);

        // Get any existing Xp data for level info
        List<UserXp> xpData = await _context.UserXp
            .AsNoTracking()
            .Where(xp => userIds.Contains(xp.UserId))
            .ToListAsync(cancellationToken);

        int startRank = ((request.Page - 1) * request.PageSize) + 1;
        List<LeaderboardEntryDto> leaderboard = new();

        for (int i = 0; i < weeklyXp.Count; i++)
        {
            var entry = weeklyXp[i];
            if (userMap.TryGetValue(entry.UserId, out User? user))
            {
                UserXp? userXp = xpData.FirstOrDefault(xp => xp.UserId == entry.UserId);
                leaderboard.Add(new LeaderboardEntryDto
                {
                    Rank = startRank + i,
                    UserId = entry.UserId,
                    DisplayName = user.DisplayName,
                    TotalXp = entry.TotalXp,
                    CurrentLevel = userXp?.CurrentLevel ?? 1
                });
            }
        }

        return leaderboard;
    }
}