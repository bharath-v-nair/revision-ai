using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.SpacedRepetition.Commands.ReviewQuestion;

public class ReviewQuestionCommandHandler : IRequestHandler<ReviewQuestionCommand, ReviewQuestionResponse>
{
    private readonly IAppDbContext _context;
    private readonly ISm2Service _sm2Service;

    public ReviewQuestionCommandHandler(IAppDbContext context, ISm2Service sm2Service)
    {
        _context = context;
        _sm2Service = sm2Service;
    }

    public async Task<ReviewQuestionResponse> Handle(ReviewQuestionCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate question exists
        Question? question = await _context.Questions
            .AsNoTracking()
            .FirstOrDefaultAsync(q => q.Id == request.QuestionId, cancellationToken);

        if (question is null)
        {
            throw new ValidationException(
                "Question not found.",
                [new FluentValidation.Results.ValidationFailure("QuestionId", "Question not found.")]);
        }

        // 2. Check correctness
        bool isCorrect = request.SelectedOption == question.CorrectOption;

        // 3. Find existing schedule or use defaults
        QuestionSchedule? existingSchedule = await _context.QuestionSchedules
            .FirstOrDefaultAsync(
                qs => qs.UserId == request.UserId && qs.QuestionId == request.QuestionId,
                cancellationToken);

        double currentEaseFactor = existingSchedule?.EaseFactor ?? 2.5;
        int currentInterval = existingSchedule?.Interval ?? 0;
        int currentRepetitions = existingSchedule?.Repetitions ?? 0;

        // 4. Calculate SM-2
        Sm2Result sm2result = _sm2Service.Calculate(isCorrect, currentEaseFactor, currentInterval, currentRepetitions);

        // 5. Create or update QuestionSchedule
        if (existingSchedule is null)
        {
            QuestionSchedule newSchedule = new()
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                QuestionId = request.QuestionId,
                EaseFactor = sm2result.NewEaseFactor,
                Interval = sm2result.NewInterval,
                Repetitions = isCorrect ? 1 : 0,
                NextReviewDate = sm2result.NextReviewDate,
                LastReviewedAt = DateTime.UtcNow
            };
            _context.Add(newSchedule);
        }
        else
        {
            existingSchedule.EaseFactor = sm2result.NewEaseFactor;
            existingSchedule.Interval = sm2result.NewInterval;
            existingSchedule.Repetitions = isCorrect ? existingSchedule.Repetitions + 1 : 0;
            existingSchedule.NextReviewDate = sm2result.NextReviewDate;
            existingSchedule.LastReviewedAt = DateTime.UtcNow;
        }

        // 6. Create UserAttempt
        UserAttempt attempt = new()
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            QuestionId = request.QuestionId,
            SelectedOption = request.SelectedOption,
            IsCorrect = isCorrect,
            TimeTakenMs = request.TimeTakenMs,
            AttemptNumber = 1,
            SessionType = "SpacedRepetition",
            CreatedAt = DateTime.UtcNow
        };
        _context.Add(attempt);

        await _context.SaveChangesAsync(cancellationToken);

        // 7. Return response
        return new ReviewQuestionResponse
        {
            IsCorrect = isCorrect,
            CorrectOption = question.CorrectOption,
            Explanation = question.Explanation,
            NewEaseFactor = sm2result.NewEaseFactor,
            NewInterval = sm2result.NewInterval,
            NextReviewDate = sm2result.NextReviewDate
        };
    }
}