using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Mocks.Queries.GetMockResults;

public class GetMockResultsQueryHandler : IRequestHandler<GetMockResultsQuery, GetMockResultsResponse?>
{
    private readonly IAppDbContext _dbContext;

    public GetMockResultsQueryHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<GetMockResultsResponse?> Handle(GetMockResultsQuery request, CancellationToken cancellationToken)
    {
        Domain.Entities.MockSession? session = await _dbContext.MockSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.MockSessionId, cancellationToken);

        if (session is null || session.UserId != request.UserId)
            return null;

        if (!session.CompletedAt.HasValue)
            throw new ValidationException("Mock session is not yet completed.");

        List<MockResultQuestionDto> questions = await _dbContext.MockSessionAnswers
            .AsNoTracking()
            .Where(a => a.MockSessionId == request.MockSessionId)
            .OrderBy(a => a.DisplayOrder)
            .Select(a => new MockResultQuestionDto
            {
                DisplayOrder = a.DisplayOrder,
                QuestionId = a.Question.Id,
                QuestionText = a.Question.QuestionText,
                OptionA = a.Question.OptionA,
                OptionB = a.Question.OptionB,
                OptionC = a.Question.OptionC,
                OptionD = a.Question.OptionD,
                SelectedOption = a.SelectedOption,
                IsCorrect = a.IsCorrect,
                CorrectOption = a.Question.CorrectOption,
                Explanation = a.Question.Explanation,
                TimeTakenMs = a.TimeTakenMs,
                HasMedia = a.Question.HasMedia
            })
            .ToListAsync(cancellationToken);

        int correctCount = questions.Count(q => q.IsCorrect == true);
        int incorrectCount = questions.Count(q => q.SelectedOption.HasValue && q.IsCorrect == false);
        int skippedCount = questions.Count(q => !q.SelectedOption.HasValue);

        double? timeTakenSeconds = null;
        if (session.CompletedAt.HasValue)
        {
            timeTakenSeconds = (session.CompletedAt.Value - session.StartedAt).TotalSeconds;
        }

        return new GetMockResultsResponse
        {
            MockSessionId = session.Id,
            TotalQuestions = session.QuestionCount,
            CorrectCount = correctCount,
            IncorrectCount = incorrectCount,
            SkippedCount = skippedCount,
            Score = session.Score ?? 0,
            TimeTakenSeconds = timeTakenSeconds,
            Questions = questions
        };
    }
}