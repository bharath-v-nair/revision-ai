using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Analysis.Queries.GetDashboard;

public class GetDashboardQueryHandler : IRequestHandler<GetDashboardQuery, GetDashboardResponse>
{
    private readonly IAppDbContext _context;

    public GetDashboardQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetDashboardResponse> Handle(GetDashboardQuery request, CancellationToken cancellationToken)
    {
        // Overall stats from all UserAttempts
        List<DashboardAttemptProjection> attempts = await _context.UserAttempts
            .AsNoTracking()
            .Where(ua => ua.UserId == request.UserId)
            .Select(ua => new DashboardAttemptProjection
            {
                IsCorrect = ua.IsCorrect,
                SubjectId = ua.Question.SubjectId,
                SubjectName = ua.Question.Subject.Name
            })
            .ToListAsync(cancellationToken);

        int totalQuestionsAnswered = attempts.Count;
        int totalCorrect = attempts.Count(a => a.IsCorrect);
        int totalIncorrect = attempts.Count(a => !a.IsCorrect);

        double overallAccuracy = totalQuestionsAnswered > 0
            ? Math.Round((double)totalCorrect / totalQuestionsAnswered * 100.0, 2)
            : 0.0;

        // Streak: read from UserStreak, default 0
        int streakDays = await _context.UserStreaks
            .AsNoTracking()
            .Where(us => us.UserId == request.UserId)
            .Select(us => us.CurrentStreak)
            .FirstOrDefaultAsync(cancellationToken);

        // XP: read from UserXp, default 0
        Domain.Entities.UserXp? userXp = await _context.UserXp
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == request.UserId, cancellationToken);

        int totalXp = userXp?.TotalXp ?? 0;
        int currentLevel = userXp?.CurrentLevel ?? 0;

        // Subject breakdown: group by SubjectId, compute accuracy
        var subjectAccuracies = attempts
            .GroupBy(a => new { a.SubjectId, a.SubjectName })
            .Select(g => new SubjectAccuracyDto
            {
                SubjectId = g.Key.SubjectId,
                SubjectName = g.Key.SubjectName,
                Accuracy = Math.Round((double)g.Count(a => a.IsCorrect) / g.Count() * 100.0, 2)
            })
            .ToList();

        SubjectAccuracyDto? weakestSubject = null;
        SubjectAccuracyDto? strongestSubject = null;

        if (subjectAccuracies.Count > 0)
        {
            weakestSubject = subjectAccuracies.OrderBy(s => s.Accuracy).First();
            strongestSubject = subjectAccuracies.OrderByDescending(s => s.Accuracy).First();
        }

        return new GetDashboardResponse
        {
            TotalQuestionsAnswered = totalQuestionsAnswered,
            TotalCorrect = totalCorrect,
            TotalIncorrect = totalIncorrect,
            OverallAccuracy = overallAccuracy,
            StreakDays = streakDays,
            TotalXp = totalXp,
            CurrentLevel = currentLevel,
            WeakestSubject = weakestSubject,
            StrongestSubject = strongestSubject
        };
    }

    private sealed class DashboardAttemptProjection
    {
        public bool IsCorrect { get; set; }
        public Guid SubjectId { get; set; }
        public string SubjectName { get; set; } = string.Empty;
    }
}