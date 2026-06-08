using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Mocks.Commands.GenerateMock;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Mocks.Commands.RetakeIncorrect;

public class RetakeIncorrectCommandHandler : IRequestHandler<RetakeIncorrectCommand, GenerateMockResponse>
{
    private readonly IAppDbContext _dbContext;

    public RetakeIncorrectCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<GenerateMockResponse> Handle(RetakeIncorrectCommand request, CancellationToken cancellationToken)
    {
        // Load previous session with answers
        Domain.Entities.MockSession? previousSession = await _dbContext.MockSessions
            .FirstOrDefaultAsync(m => m.Id == request.PreviousMockSessionId, cancellationToken);

        if (previousSession is null || previousSession.UserId != request.UserId)
            throw new ValidationException("Previous mock session not found.");

        // Find incorrect answer rows
        List<Guid> incorrectQuestionIds = await _dbContext.MockSessionAnswers
            .Where(a => a.MockSessionId == request.PreviousMockSessionId && a.IsCorrect == false)
            .OrderBy(a => a.DisplayOrder)
            .Select(a => a.QuestionId)
            .ToListAsync(cancellationToken);

        if (incorrectQuestionIds.Count == 0)
            throw new ValidationException("No incorrect answers found in the previous session.");

        // Load the questions
        List<Question> questionEntities = await _dbContext.Questions
            .Where(q => incorrectQuestionIds.Contains(q.Id))
            .ToListAsync(cancellationToken);

        // Maintain display order by ordering per incorrectQuestionIds
        var questionMap = questionEntities.ToDictionary(q => q.Id);

        // Create new MockSession
        string configJson = JsonSerializer.Serialize(new
        {
            PreviousMockSessionId = request.PreviousMockSessionId,
            RetakeIncorrect = true,
            QuestionCount = incorrectQuestionIds.Count
        });

        Domain.Entities.MockSession session = new()
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            MockConfig = configJson,
            QuestionCount = incorrectQuestionIds.Count,
            Score = 0,
            StartedAt = DateTime.UtcNow,
            CompletedAt = null
        };

        _dbContext.Add(session);

        int displayOrder = 1;
        List<MockQuestionDto> questionDtos = new(incorrectQuestionIds.Count);

        foreach (Guid questionId in incorrectQuestionIds)
        {
            if (!questionMap.TryGetValue(questionId, out Question? question))
                continue;

            MockSessionAnswer answer = new()
            {
                Id = Guid.NewGuid(),
                MockSessionId = session.Id,
                QuestionId = question.Id,
                SelectedOption = null,
                IsCorrect = null,
                TimeTakenMs = null,
                DisplayOrder = displayOrder
            };
            _dbContext.Add(answer);

            questionDtos.Add(new MockQuestionDto
            {
                DisplayOrder = displayOrder,
                QuestionId = question.Id,
                QuestionText = question.QuestionText,
                OptionA = question.OptionA,
                OptionB = question.OptionB,
                OptionC = question.OptionC,
                OptionD = question.OptionD
            });

            displayOrder++;
        }

        await _dbContext.SaveChangesAsync(cancellationToken);

        return new GenerateMockResponse
        {
            MockSessionId = session.Id,
            TotalQuestions = incorrectQuestionIds.Count,
            TimeLimitMinutes = null,
            Questions = questionDtos
        };
    }
}