using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Analysis.Commands.AnalyzeBatch;

public class AnalyzeBatchCommandHandler : IRequestHandler<AnalyzeBatchCommand, AnalyzeBatchResponse>
{
    private readonly IAppDbContext _context;

    public AnalyzeBatchCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AnalyzeBatchResponse> Handle(AnalyzeBatchCommand request, CancellationToken cancellationToken)
    {
        // Validate question IDs not empty
        if (request.QuestionIds.Count == 0)
        {
            throw new ValidationException("Question IDs must not be empty.");
        }

        // Validate question IDs exist
        int existingCount = await _context.Questions
            .AsNoTracking()
            .CountAsync(q => request.QuestionIds.Contains(q.Id), cancellationToken);

        if (existingCount != request.QuestionIds.Count)
        {
            throw new ValidationException("One or more question IDs are invalid.");
        }

        // Get all attempts for these questions by this user
        List<BatchAttemptProjection> attempts = await _context.UserAttempts
            .AsNoTracking()
            .Where(ua => ua.UserId == request.UserId && request.QuestionIds.Contains(ua.QuestionId))
            .Select(ua => new BatchAttemptProjection
            {
                IsCorrect = ua.IsCorrect,
                TimeTakenMs = ua.TimeTakenMs
            })
            .ToListAsync(cancellationToken);

        int correctCount = attempts.Count(a => a.IsCorrect);
        int incorrectCount = attempts.Count(a => !a.IsCorrect);
        int totalAttempts = attempts.Count;

        double accuracyPercentage = totalAttempts > 0
            ? Math.Round((double)correctCount / totalAttempts * 100.0, 2)
            : 0.0;

        double averageTimeMs = totalAttempts > 0
            ? Math.Round(attempts.Average(a => a.TimeTakenMs), 2)
            : 0.0;

        return new AnalyzeBatchResponse
        {
            TotalQuestions = request.QuestionIds.Count,
            CorrectCount = correctCount,
            IncorrectCount = incorrectCount,
            AccuracyPercentage = accuracyPercentage,
            AverageTimeMs = averageTimeMs
        };
    }

    private sealed class BatchAttemptProjection
    {
        public bool IsCorrect { get; set; }
        public int TimeTakenMs { get; set; }
    }
}