using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.SpacedRepetition.Queries.GetSpacedRepetitionStats;

public class GetSpacedRepetitionStatsQueryHandler : IRequestHandler<GetSpacedRepetitionStatsQuery, GetSpacedRepetitionStatsResponse>
{
    private readonly IAppDbContext _context;

    public GetSpacedRepetitionStatsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetSpacedRepetitionStatsResponse> Handle(GetSpacedRepetitionStatsQuery request, CancellationToken cancellationToken)
    {
        DateTime todayEnd = DateTime.UtcNow.Date.AddDays(1);

        int totalScheduled = await _context.QuestionSchedules
            .AsNoTracking()
            .CountAsync(qs => qs.UserId == request.UserId, cancellationToken);

        int dueToday = await _context.QuestionSchedules
            .AsNoTracking()
            .CountAsync(qs => qs.UserId == request.UserId && qs.NextReviewDate < todayEnd, cancellationToken);

        double averageEaseFactor = await _context.QuestionSchedules
            .AsNoTracking()
            .Where(qs => qs.UserId == request.UserId)
            .AverageAsync(qs => (double?)qs.EaseFactor, cancellationToken) ?? 0.0;

        int totalReviews = await _context.UserAttempts
            .AsNoTracking()
            .CountAsync(ua => ua.UserId == request.UserId && ua.SessionType == "SpacedRepetition", cancellationToken);

        return new GetSpacedRepetitionStatsResponse
        {
            TotalScheduled = totalScheduled,
            DueToday = dueToday,
            AverageEaseFactor = Math.Round(averageEaseFactor, 2),
            TotalReviews = totalReviews
        };
    }
}