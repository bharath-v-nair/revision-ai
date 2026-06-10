using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using MediatR;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Mocks.Commands.GenerateMock;

namespace RevisionAI.Application.Mocks.Queries.GetMockSession;

public class GetMockSessionQueryHandler : IRequestHandler<GetMockSessionQuery, GetMockSessionResponse?>
{
    private readonly IAppDbContext _dbContext;

    public GetMockSessionQueryHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<GetMockSessionResponse?> Handle(GetMockSessionQuery request, CancellationToken cancellationToken)
    {
        Domain.Entities.MockSession? session = await _dbContext.MockSessions
            .AsNoTracking()
            .FirstOrDefaultAsync(m => m.Id == request.MockSessionId, cancellationToken);

        if (session is null || session.UserId != request.UserId)
            return null;

        List<MockQuestionDto> questions = await _dbContext.MockSessionAnswers
            .AsNoTracking()
            .Where(a => a.MockSessionId == request.MockSessionId)
            .OrderBy(a => a.DisplayOrder)
            .Select(a => new MockQuestionDto
            {
                DisplayOrder = a.DisplayOrder,
                QuestionId = a.Question.Id,
                QuestionText = a.Question.QuestionText,
                OptionA = a.Question.OptionA,
                OptionB = a.Question.OptionB,
                OptionC = a.Question.OptionC,
                OptionD = a.Question.OptionD,
                HasMedia = a.Question.HasMedia
            })
            .ToListAsync(cancellationToken);

        int? timeLimitMinutes = null;
        if (!string.IsNullOrEmpty(session.MockConfig))
        {
            var configDoc = JsonDocument.Parse(session.MockConfig);
            if (configDoc.RootElement.TryGetProperty("TimeLimitMinutes", out JsonElement timeElement)
                && timeElement.ValueKind != JsonValueKind.Null)
            {
                timeLimitMinutes = timeElement.GetInt32();
            }
        }

        return new GetMockSessionResponse
        {
            MockSessionId = session.Id,
            Config = session.MockConfig,
            TotalQuestions = session.QuestionCount,
            TimeLimitMinutes = timeLimitMinutes,
            StartedAt = session.StartedAt,
            IsCompleted = session.CompletedAt.HasValue,
            Score = session.Score,
            Questions = questions
        };
    }
}