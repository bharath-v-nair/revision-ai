using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Gamification.Queries.GetAchievementDetail;

public class GetAchievementDetailQueryHandler : IRequestHandler<GetAchievementDetailQuery, AchievementDto?>
{
    private readonly IAppDbContext _context;

    public GetAchievementDetailQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AchievementDto?> Handle(GetAchievementDetailQuery request, CancellationToken cancellationToken)
    {
        Guid userId = request.UserId;

        Achievement? achievement = await _context.Achievements
            .AsNoTracking()
            .FirstOrDefaultAsync(a => a.Id == request.AchievementId && a.UserId == userId, cancellationToken);

        AchievementDefinition? def = Array.Find(AchievementDefinitions.All, d => d.Type == achievement?.AchievementKey);

        if (def is null || achievement is null)
        {
            return null;
        }

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

        return new AchievementDto
        {
            Id = achievement.Id,
            Type = def.Type,
            Name = def.Name,
            Description = def.Description,
            IconUrl = def.IconUrl,
            ProgressPercent = progressPercent,
            IsUnlocked = true,
            UnlockedAt = achievement.UnlockedAt
        };
    }
}