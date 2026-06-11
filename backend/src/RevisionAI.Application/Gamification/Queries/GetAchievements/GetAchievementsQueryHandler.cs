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

        int correctAnswers = await _context.UserAttempts
            .AsNoTracking()
            .Where(a => a.UserId == userId && a.IsCorrect)
            .CountAsync(cancellationToken);

        int totalMocksCompleted = await _context.MockSessions
            .AsNoTracking()
            .Where(m => m.UserId == userId && m.CompletedAt != null)
            .CountAsync(cancellationToken);

        int totalBookmarks = await _context.BookmarkItems
            .AsNoTracking()
            .Where(b => b.Collection.UserId == userId)
            .CountAsync(cancellationToken);

        int totalXp = userXp?.TotalXp ?? 0;
        int currentStreak = streak?.CurrentStreak ?? 0;
        int accuracyPercent = AchievementProgressHelper.CalcAccuracy(totalQuestionsAnswered, correctAnswers);

        List<Achievement> unlockedAchievements = await _context.Achievements
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .ToListAsync(cancellationToken);

        var unlockedMap = unlockedAchievements.ToDictionary(a => a.AchievementKey);

        List<AchievementDto> result = new();

        foreach (AchievementDefinition def in AchievementDefinitions.All)
        {
            int progress = AchievementProgressHelper.GetProgress(
                def.Type, totalXp, currentStreak,
                totalQuestionsAnswered, totalMocksCompleted,
                accuracyPercent, totalBookmarks);

            int progressPercent = def.ProgressMax > 0
                ? Math.Min(100, progress * 100 / def.ProgressMax)
                : 100;

            unlockedMap.TryGetValue(def.Type, out Achievement? existing);

            result.Add(new AchievementDto
            {
                Id = existing?.Id ?? Guid.Empty,
                Type = def.Type,
                Name = def.Name,
                Description = def.Description,
                IconUrl = def.IconUrl,
                ProgressPercent = progressPercent,
                IsUnlocked = existing is not null,
                UnlockedAt = existing?.UnlockedAt
            });
        }

        return result;
    }
}
