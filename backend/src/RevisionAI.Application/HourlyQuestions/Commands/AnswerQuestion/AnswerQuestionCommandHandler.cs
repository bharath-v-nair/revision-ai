using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.HourlyQuestions.Commands.AnswerQuestion;

public class AnswerQuestionCommandHandler : IRequestHandler<AnswerQuestionCommand, AnswerQuestionResponse>
{
    private readonly IAppDbContext _context;

    public AnswerQuestionCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<AnswerQuestionResponse> Handle(AnswerQuestionCommand request, CancellationToken cancellationToken)
    {
        // 1. Load the pending question (must belong to user)
        PendingQuestion? pendingQuestion = await _context.PendingQuestions
            .Include(pq => pq.Question)
            .ThenInclude(q => q.Subject)
            .Include(pq => pq.Question)
            .ThenInclude(q => q.Chapter)
            .FirstOrDefaultAsync(
                pq => pq.Id == request.PendingQuestionId && pq.UserId == request.UserId,
                cancellationToken);

        if (pendingQuestion is null)
        {
            throw new ValidationException(
                "Pending question not found.",
                [new FluentValidation.Results.ValidationFailure("PendingQuestionId", "Pending question not found.")]);
        }

        // 2. Validate not expired
        if (pendingQuestion.ExpiresAt <= DateTime.UtcNow)
        {
            throw new ValidationException(
                "This question has expired.",
                [new FluentValidation.Results.ValidationFailure("PendingQuestionId", "This question has expired.")]);
        }

        // 3. Validate not already answered
        if (pendingQuestion.IsAnswered)
        {
            throw new ValidationException(
                "This question has already been answered.",
                [new FluentValidation.Results.ValidationFailure("PendingQuestionId", "This question has already been answered.")]);
        }

        // 4. Parse selected option and check correctness
        char selectedOption = request.SelectedOption.Trim().ToUpperInvariant()[0];
        bool isCorrect = selectedOption == pendingQuestion.Question.CorrectOption;

        // 5. Create UserAttempt
        UserAttempt attempt = new()
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            QuestionId = pendingQuestion.QuestionId,
            SelectedOption = selectedOption,
            IsCorrect = isCorrect,
            TimeTakenMs = 0,
            AttemptNumber = 1,
            SessionType = "Hourly",
            CreatedAt = DateTime.UtcNow
        };
        _context.Add(attempt);

        // 6. Mark pending question as answered
        pendingQuestion.IsAnswered = true;

        // 7. Seed SR queue — create a QuestionSchedule for this question if one doesn't exist.
        // This is what makes the question appear in Daily Review after the user first encounters it.
        // Correct answers: review in 1 day. Wrong answers: review in 10 minutes (0.007 days ≈ 10 min).
        bool scheduleExists = await _context.QuestionSchedules
            .AnyAsync(qs => qs.UserId == request.UserId && qs.QuestionId == pendingQuestion.QuestionId, cancellationToken);

        if (!scheduleExists)
        {
            DateTime nextReview = isCorrect
                ? DateTime.UtcNow.AddDays(1)
                : DateTime.UtcNow.AddMinutes(10);

            QuestionSchedule schedule = new()
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                QuestionId = pendingQuestion.QuestionId,
                EaseFactor = 2.5,
                Interval = isCorrect ? 1 : 0,
                Repetitions = isCorrect ? 1 : 0,
                NextReviewDate = nextReview,
                LastReviewedAt = DateTime.UtcNow,
            };
            _context.Add(schedule);
        }

        await _context.SaveChangesAsync(cancellationToken);

        // 7. Return response
        return new AnswerQuestionResponse
        {
            IsCorrect = isCorrect,
            CorrectOption = pendingQuestion.Question.CorrectOption,
            Explanation = pendingQuestion.Question.Explanation
        };
    }
}