using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Analysis.Queries.GetQuestionHistory;

public class GetQuestionHistoryQueryHandler : IRequestHandler<GetQuestionHistoryQuery, GetQuestionHistoryResponse>
{
    private readonly IAppDbContext _context;

    public GetQuestionHistoryQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetQuestionHistoryResponse> Handle(GetQuestionHistoryQuery request, CancellationToken cancellationToken)
    {
        // Fetch question text
        string? questionText = await _context.Questions
            .AsNoTracking()
            .Where(q => q.Id == request.QuestionId)
            .Select(q => q.QuestionText)
            .FirstOrDefaultAsync(cancellationToken);

        // Fetch question schedule (SR state)
        Domain.Entities.QuestionSchedule? schedule = await _context.QuestionSchedules
            .AsNoTracking()
            .FirstOrDefaultAsync(qs => qs.UserId == request.UserId && qs.QuestionId == request.QuestionId, cancellationToken);

        double currentEaseFactor = schedule?.EaseFactor ?? 0.0;
        int currentInterval = schedule?.Interval ?? 0;

        // Fetch attempts ordered by createdAt ASC
        List<AttemptDto> attempts = await _context.UserAttempts
            .AsNoTracking()
            .Where(ua => ua.UserId == request.UserId && ua.QuestionId == request.QuestionId)
            .OrderBy(ua => ua.CreatedAt)
            .Select(ua => new AttemptDto
            {
                SessionType = ua.SessionType,
                SelectedOption = ua.SelectedOption,
                IsCorrect = ua.IsCorrect,
                TimeTakenMs = ua.TimeTakenMs,
                CreatedAt = ua.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new GetQuestionHistoryResponse
        {
            QuestionText = questionText ?? string.Empty,
            CurrentEaseFactor = currentEaseFactor,
            CurrentInterval = currentInterval,
            Attempts = attempts
        };
    }
}