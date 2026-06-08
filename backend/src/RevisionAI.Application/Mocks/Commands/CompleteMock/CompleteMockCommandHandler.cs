using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Mocks.Commands.CompleteMock;

public class CompleteMockCommandHandler : IRequestHandler<CompleteMockCommand, CompleteMockResponse>
{
    private readonly IAppDbContext _dbContext;

    public CompleteMockCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<CompleteMockResponse> Handle(CompleteMockCommand request, CancellationToken cancellationToken)
    {
        Domain.Entities.MockSession? session = await _dbContext.MockSessions
            .FirstOrDefaultAsync(m => m.Id == request.MockSessionId, cancellationToken);

        if (session is null || session.UserId != request.UserId)
            throw new ValidationException("Mock session not found.");

        if (session.CompletedAt.HasValue)
            throw new ValidationException("Mock session is already completed.");

        // Mark as completed
        session.CompletedAt = DateTime.UtcNow;

        // Compute stats from MockSessionAnswer rows
        List<Domain.Entities.MockSessionAnswer> answers = await _dbContext.MockSessionAnswers
            .Where(a => a.MockSessionId == request.MockSessionId)
            .ToListAsync(cancellationToken);

        int answeredCount = answers.Count(a => a.SelectedOption.HasValue);
        int correctCount = answers.Count(a => a.IsCorrect == true);
        int skippedCount = answers.Count(a => !a.SelectedOption.HasValue);
        int finalScore = answers.Count(a => a.IsCorrect == true);

        session.Score = finalScore;

        double? timeTakenSeconds = null;
        if (session.StartedAt != default)
        {
            timeTakenSeconds = (DateTime.UtcNow - session.StartedAt).TotalSeconds;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new CompleteMockResponse
        {
            MockSessionId = session.Id,
            TotalQuestions = session.QuestionCount,
            AnsweredCount = answeredCount,
            CorrectCount = correctCount,
            SkippedCount = skippedCount,
            Score = finalScore,
            TimeTakenSeconds = timeTakenSeconds
        };
    }
}