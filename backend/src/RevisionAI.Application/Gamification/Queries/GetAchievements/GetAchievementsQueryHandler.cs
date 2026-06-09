using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Gamification.Queries.GetAchievements;

public class GetAchievementsQueryHandler : IRequestHandler<GetAchievementsQuery, List<AchievementDto>>
{
    private readonly IAppDbContext _context;

    public GetAchievementsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<AchievementDto>> Handle(GetAchievementsQuery request, CancellationToken cancellationToken)
    {
        Guid userId = request.UserId;

        // Load progress data
        UserXp? userXp = await _context.UserXp
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        UserStreak? streak = await _context.UserStreaks
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == userId, cancellationToken);

        int totalQuestionsAnswered = await _context.UserAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .CountAsync(cancellationToken);

        int totalMocksCompleted = await _context.MockSessions
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.CompletedAt != null)
            .CountAsync(cancellationToken);

        int totalXp = userXp?.TotalXp ?? 0;
        int currentStreak = streak?.CurrentStreak ?? 0;

        // Get unlocked achievements
        List<Achievement> unlockedAchievements = await _context.Achievements
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .ToListAsync(cancellationToken);

        var unlockedMap = unlockedAchievements
            .ToDictionary(a => a.AchievementKey);

        List<AchievementDto> result = new();

        foreach (AchievementDefinition def in AchievementDefinitions.All)
        {
            DateTime? unlockedAt = null;

            // Determine progress
            int progress = def.Type switch
            {
                string t when t.StartsWith("total_xp_", StringComparison.Ordinal) => totalXp,
                string t when t.StartsWith("streak_", StringComparison.Ordinal) => currentStreak,
                string t when t.StartsWith("questions_", StringComparison.Ordinal) => totalQuestionsAnswered,
                string t when t.StartsWith("mocks_", StringComparison.Ordinal) => totalMocksCompleted,
                _ => 0
            };

            int progressPercent = def.ProgressMax > 0
                ? Math.Min(100, (progress * 100) / def.ProgressMax)
                : 100;

            if (unlockedMap.TryGetValue(def.Type, out Achievement? existing))
            {
                unlockedAt = existing.UnlockedAt;
            }

            result.Add(new AchievementDto
            {
                Id = existing?.Id ?? Guid.Empty,
                Type = def.Type,
                Name = def.Name,
                Description = def.Description,
                IconUrl = def.IconUrl,
                ProgressPercent = progressPercent,
                IsUnlocked = existing is not null,
                UnlockedAt = unlockedAt
            });
        }

        return result;
    }
}