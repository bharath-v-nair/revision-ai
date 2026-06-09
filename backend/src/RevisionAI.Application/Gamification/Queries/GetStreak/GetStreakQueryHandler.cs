using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Gamification.Queries.GetStreak;

public class GetStreakQueryHandler : IRequestHandler<GetStreakQuery, StreakDto>
{
    private readonly IAppDbContext _context;

    public GetStreakQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<StreakDto> Handle(GetStreakQuery request, CancellationToken cancellationToken)
    {
        UserStreak? streak = await _context.UserStreaks
            .AsNoTracking()
            .FirstOrDefaultAsync(s => s.UserId == request.UserId, cancellationToken);

        if (streak is null)
        {
            return new StreakDto
            {
                CurrentStreak = 0,
                LongestStreak = 0,
                LastActivityDate = null,
                IsAtRisk = false
            };
        }

        var today = DateOnly.FromDateTime(DateTime.UtcNow);
        bool isAtRisk = streak.LastActiveDate.HasValue && streak.LastActiveDate.Value < today.AddDays(-1);

        return new StreakDto
        {
            CurrentStreak = streak.CurrentStreak,
            LongestStreak = streak.LongestStreak,
            LastActivityDate = streak.LastActiveDate,
            IsAtRisk = isAtRisk
        };
    }
}