using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Gamification.Commands.CheckAchievements;

public class CheckAchievementsCommandHandler : IRequestHandler<CheckAchievementsCommand, CheckAchievementsResponse>
{
    private readonly IAppDbContext _context;

    public CheckAchievementsCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<CheckAchievementsResponse> Handle(CheckAchievementsCommand request, CancellationToken cancellationToken)
    {
        Guid userId = request.UserId;

        // Load current progress data
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

        // Get existing achievement keys for this user
        var existingKeys = (await _context.Achievements
            .AsNoTracking()
            .Where(a => a.UserId == userId)
            .Select(a => a.AchievementKey)
            .ToListAsync(cancellationToken))
            .ToHashSet();

        DateTime now = DateTime.UtcNow;
        List<AchievementDto> newlyUnlocked = new();

        foreach (AchievementDefinition def in AchievementDefinitions.All)
        {
            if (existingKeys.Contains(def.Type))
            {
                continue; // Already unlocked
            }

            int progress = def.Type switch
            {
                string t when t.StartsWith("total_xp_", StringComparison.Ordinal) => totalXp,
                string t when t.StartsWith("streak_", StringComparison.Ordinal) => currentStreak,
                string t when t.StartsWith("questions_", StringComparison.Ordinal) => totalQuestionsAnswered,
                string t when t.StartsWith("mocks_", StringComparison.Ordinal) => totalMocksCompleted,
                _ => 0
            };

            if (progress >= def.ProgressMax)
            {
                Achievement achievement = new()
                {
                    Id = Guid.NewGuid(),
                    UserId = userId,
                    AchievementKey = def.Type,
                    UnlockedAt = now
                };
                _context.Add(achievement);

                newlyUnlocked.Add(new AchievementDto
                {
                    Id = achievement.Id,
                    Type = def.Type,
                    Name = def.Name,
                    Description = def.Description,
                    IconUrl = def.IconUrl,
                    ProgressPercent = 100,
                    IsUnlocked = true,
                    UnlockedAt = now
                });
            }
        }

        if (newlyUnlocked.Count > 0)
        {
            await _context.SaveChangesAsync(cancellationToken);
        }

        return new CheckAchievementsResponse
        {
            NewlyUnlocked = newlyUnlocked
        };
    }
}