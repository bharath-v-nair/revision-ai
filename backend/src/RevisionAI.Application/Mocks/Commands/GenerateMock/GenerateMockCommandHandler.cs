using System.Text.Json;
using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Mocks.Commands.GenerateMock;

public class GenerateMockCommandHandler : IRequestHandler<GenerateMockCommand, GenerateMockResponse>
{
    private readonly IAppDbContext _dbContext;

    public GenerateMockCommandHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<GenerateMockResponse> Handle(GenerateMockCommand request, CancellationToken cancellationToken)
    {
        // Validate question count
        if (request.QuestionCount < 1)
            throw new ValidationException("QuestionCount must be at least 1.");

        if (request.SubjectIds.Count == 0)
            throw new ValidationException("At least one subject must be selected.");

        // Randomly select questions from requested subjects
        List<Question> selectedQuestions = await _dbContext.Questions
            .AsNoTracking()
            .Where(q => request.SubjectIds.Contains(q.SubjectId))
            .OrderBy(_ => Guid.NewGuid())
            .Take(request.QuestionCount)
            .ToListAsync(cancellationToken);

        if (selectedQuestions.Count == 0)
            throw new ValidationException("No questions found for the selected subjects.");

        // Create MockSession
        string configJson = JsonSerializer.Serialize(new
        {
            request.SubjectIds,
            request.QuestionCount,
            request.TimeLimitMinutes
        });

        MockSession session = new()
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId,
            MockConfig = configJson,
            QuestionCount = selectedQuestions.Count,
            Score = 0,
            StartedAt = DateTime.UtcNow,
            CompletedAt = null
        };

        _dbContext.Add(session);

        // Create MockSessionAnswer rows with display order
        int displayOrder = 1;
        List<MockQuestionDto> questionDtos = new(selectedQuestions.Count);

        foreach (Question question in selectedQuestions)
        {
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
            TotalQuestions = selectedQuestions.Count,
            TimeLimitMinutes = request.TimeLimitMinutes,
            Questions = questionDtos
        };
    }
}