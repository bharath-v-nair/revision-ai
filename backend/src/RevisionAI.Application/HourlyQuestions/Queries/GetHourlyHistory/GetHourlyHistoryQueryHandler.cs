using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.HourlyQuestions.Queries.GetPendingQuestions;
using RevisionAI.Application.Questions.Queries.GetQuestions;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.HourlyQuestions.Queries.GetHourlyHistory;

public class GetHourlyHistoryQueryHandler : IRequestHandler<GetHourlyHistoryQuery, GetHourlyHistoryResponse>
{
    private readonly IAppDbContext _context;

    public GetHourlyHistoryQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetHourlyHistoryResponse> Handle(GetHourlyHistoryQuery request, CancellationToken cancellationToken)
    {
        DateTime utcNow = DateTime.UtcNow;

        // Get hourly-history pending questions: answered OR expired
        IQueryable<PendingQuestion> query = _context.PendingQuestions
            .AsNoTracking()
            .Where(pq => pq.UserId == request.UserId
                         && (pq.IsAnswered || pq.ExpiresAt <= utcNow));

        int totalCount = await query.CountAsync(cancellationToken);

        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, 100);

        List<HourlyHistoryDto> historyItems = await query
            .OrderByDescending(pq => pq.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(pq => new HourlyHistoryDto
            {
                PendingQuestionId = pq.Id,
                ExpiresAt = pq.ExpiresAt,
                IsAnswered = pq.IsAnswered,
                AnsweredAt = pq.IsAnswered
                    ? _context.UserAttempts
                        .Where(ua => ua.UserId == request.UserId
                                     && ua.QuestionId == pq.QuestionId
                                     && ua.SessionType == "Hourly")
                        .Select(ua => (DateTime?)ua.CreatedAt)
                        .FirstOrDefault()
                    : null,
                UserAnswer = pq.IsAnswered
                    ? _context.UserAttempts
                        .Where(ua => ua.UserId == request.UserId
                                     && ua.QuestionId == pq.QuestionId
                                     && ua.SessionType == "Hourly")
                        .Select(ua => ua.SelectedOption.ToString())
                        .FirstOrDefault()
                    : null,
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

        return new GetHourlyHistoryResponse
        {
            Data = historyItems,
            Meta = new MetaDto
            {
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount,
                HasNext = (page * pageSize) < totalCount
            }
        };
    }
}