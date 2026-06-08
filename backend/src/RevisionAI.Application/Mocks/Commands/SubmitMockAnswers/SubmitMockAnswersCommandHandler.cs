using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Mocks.Commands.SubmitMockAnswers;

public class SubmitMockAnswersCommandHandler : IRequestHandler<SubmitMockAnswersCommand, SubmitMockAnswersResponse>
{
    private readonly IAppDbContext _dbContext;

    public SubmitMockAnswersCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<SubmitMockAnswersResponse> Handle(SubmitMockAnswersCommand request, CancellationToken cancellationToken)
    {
        // Validate session exists and belongs to user
        Domain.Entities.MockSession? session = await _dbContext.MockSessions
            .FirstOrDefaultAsync(m => m.Id == request.MockSessionId, cancellationToken);

        if (session is null || session.UserId != request.UserId)
            throw new ValidationException("Mock session not found.");

        // Get all answers for this session
        List<MockSessionAnswer> sessionAnswers = await _dbContext.MockSessionAnswers
            .Where(a => a.MockSessionId == request.MockSessionId)
            .ToListAsync(cancellationToken);

        List<AnswerResultDto> results = new(request.Answers.Count);

        foreach (AnswerInput input in request.Answers)
        {
            MockSessionAnswer? answerRow = sessionAnswers
                .FirstOrDefault(a => a.QuestionId == input.QuestionId && a.DisplayOrder == input.DisplayOrder);

            if (answerRow is null)
                throw new ValidationException($"Question {input.QuestionId} with display order {input.DisplayOrder} not found in this session.");

            // Load the question to check correctness
            Question? question = await _dbContext.Questions
                .AsNoTracking()
                .FirstOrDefaultAsync(q => q.Id == input.QuestionId, cancellationToken);

            if (question is null)
                throw new ValidationException($"Question {input.QuestionId} not found.");

            bool isCorrect = char.ToUpperInvariant(input.SelectedOption) == char.ToUpperInvariant(question.CorrectOption);

            // Update MockSessionAnswer
            answerRow.SelectedOption = char.ToUpperInvariant(input.SelectedOption);
            answerRow.IsCorrect = isCorrect;
            answerRow.TimeTakenMs = input.TimeTakenMs;

            // Create UserAttempt record
            UserAttempt attempt = new()
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                QuestionId = input.QuestionId,
                SelectedOption = char.ToUpperInvariant(input.SelectedOption),
                IsCorrect = isCorrect,
                TimeTakenMs = input.TimeTakenMs,
                Confidence = null,
                AttemptNumber = 1,
                SessionType = "Mock",
                CreatedAt = DateTime.UtcNow
            };
            _dbContext.Add(attempt);

            // Increment session score if correct
            if (isCorrect)
            {
                session.Score = (session.Score ?? 0) + 1;
            }

            results.Add(new AnswerResultDto
            {
                QuestionId = input.QuestionId,
                DisplayOrder = input.DisplayOrder,
                IsCorrect = isCorrect,
                CorrectOption = question.CorrectOption,
                Explanation = question.Explanation
            });
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new SubmitMockAnswersResponse { Results = results };
    }
}