using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.HourlyQuestions.Queries.GetPendingQuestions;
using RevisionAI.Application.Questions.Queries.GetQuestions;

namespace RevisionAI.Application.SpacedRepetition.Queries.GetDueQuestions;

public class GetDueQuestionsQueryHandler : IRequestHandler<GetDueQuestionsQuery, GetDueQuestionsResponse>
{
    private readonly IAppDbContext _context;

    public GetDueQuestionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetDueQuestionsResponse> Handle(GetDueQuestionsQuery request, CancellationToken cancellationToken)
    {
        DateTime utcNow = DateTime.UtcNow;

        IQueryable<Domain.Entities.QuestionSchedule> dueQuery = _context.QuestionSchedules
            .AsNoTracking()
            .Where(qs => qs.UserId == request.UserId && qs.NextReviewDate <= utcNow)
            .OrderBy(qs => qs.NextReviewDate);

        int totalCount = await dueQuery.CountAsync(cancellationToken);

        int skip = (request.Page - 1) * request.PageSize;

        List<DueQuestionDto> data = await dueQuery
            .Skip(skip)
            .Take(request.PageSize)
            .Select(qs => new DueQuestionDto
            {
                QuestionScheduleId = qs.Id,
                Question = new QuestionWithoutAnswersDto
                {
                    Id = qs.Question.Id,
                    QuestionNumber = qs.Question.QuestionNumber,
                    QuestionText = qs.Question.QuestionText,
                    OptionA = qs.Question.OptionA,
                    OptionB = qs.Question.OptionB,
                    OptionC = qs.Question.OptionC,
                    OptionD = qs.Question.OptionD,
                    HasMedia = qs.Question.HasMedia,
                    SourcePage = qs.Question.SourcePage,
                    SubjectName = qs.Question.Subject.Name,
                    ChapterTitle = qs.Question.Chapter.Title
                },
                EaseFactor = qs.EaseFactor,
                Interval = qs.Interval,
                Repetitions = qs.Repetitions,
                NextReviewDate = qs.NextReviewDate
            })
            .ToListAsync(cancellationToken);

        bool hasNext = (skip + request.PageSize) < totalCount;

        return new GetDueQuestionsResponse
        {
            Data = data,
            Meta = new MetaDto
            {
                Page = request.Page,
                PageSize = request.PageSize,
                TotalCount = totalCount,
                HasNext = hasNext
            }
        };
    }
}