using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Gamification.Commands.TickStreak;

public class TickStreakCommandHandler : IRequestHandler<TickStreakCommand, StreakDto>
{
    private readonly IAppDbContext _context;

    public TickStreakCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<StreakDto> Handle(TickStreakCommand request, CancellationToken cancellationToken)
    {
        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        DateOnly yesterday = today.AddDays(-1);

        UserStreak? streak = await _context.UserStreaks
            .FirstOrDefaultAsync(s => s.UserId == request.UserId, cancellationToken);

        if (streak is null)
        {
            UserStreak newStreak = new()
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                CurrentStreak = 1,
                LongestStreak = 1,
                LastActiveDate = today
            };
            _context.Add(newStreak);
            await _context.SaveChangesAsync(cancellationToken);

            return new StreakDto
            {
                CurrentStreak = 1,
                LongestStreak = 1,
                LastActivityDate = today,
                IsAtRisk = false
            };
        }

        if (streak.LastActiveDate == today)
        {
            await _context.SaveChangesAsync(cancellationToken);

            return new StreakDto
            {
                CurrentStreak = streak.CurrentStreak,
                LongestStreak = streak.LongestStreak,
                LastActivityDate = today,
                IsAtRisk = false
            };
        }

        if (streak.LastActiveDate == yesterday)
        {
            streak.CurrentStreak += 1;
        }
        else
        {
            streak.CurrentStreak = 1;
        }

        if (streak.CurrentStreak > streak.LongestStreak)
        {
            streak.LongestStreak = streak.CurrentStreak;
        }

        streak.LastActiveDate = today;
        await _context.SaveChangesAsync(cancellationToken);

        return new StreakDto
        {
            CurrentStreak = streak.CurrentStreak,
            LongestStreak = streak.LongestStreak,
            LastActivityDate = today,
            IsAtRisk = false
        };
    }
}