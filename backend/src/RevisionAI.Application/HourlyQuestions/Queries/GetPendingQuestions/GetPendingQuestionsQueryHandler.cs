using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.HourlyQuestions.Queries.GetPendingQuestions;

public class GetPendingQuestionsQueryHandler : IRequestHandler<GetPendingQuestionsQuery, GetPendingQuestionsResponse>
{
    private readonly IAppDbContext _context;

    public GetPendingQuestionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetPendingQuestionsResponse> Handle(GetPendingQuestionsQuery request, CancellationToken cancellationToken)
    {
        DateTime utcNow = DateTime.UtcNow;

        List<PendingQuestionDto> pendingQuestions = await _context.PendingQuestions
            .AsNoTracking()
            .Where(pq => pq.UserId == request.UserId
                         && !pq.IsAnswered
                         && pq.ExpiresAt > utcNow)
            .OrderBy(pq => pq.CreatedAt)
            .Select(pq => new PendingQuestionDto
            {
                PendingQuestionId = pq.Id,
                ExpiresAt = pq.ExpiresAt,
                Question = new QuestionWithoutAnswersDto
                {
                    Id = pq.Question.Id,
                    QuestionNumber = pq.Question.QuestionNumber,
                    QuestionText = pq.Question.QuestionText,
                    OptionA = pq.Question.OptionA,
                    OptionB = pq.Question.OptionB,
                    OptionC = pq.Question.OptionC,
                    OptionD = pq.Question.OptionD,
                    HasMedia = pq.Question.HasMedia,
                    SourcePage = pq.Question.SourcePage,
                    SubjectName = pq.Question.Subject.Name,
                    ChapterTitle = pq.Question.Chapter.Title
                }
            })
            .ToListAsync(cancellationToken);

        return new GetPendingQuestionsResponse
        {
            Data = pendingQuestions
        };
    }
}