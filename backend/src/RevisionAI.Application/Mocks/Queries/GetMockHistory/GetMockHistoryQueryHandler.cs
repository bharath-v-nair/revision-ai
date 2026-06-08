using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Questions.Queries.GetQuestions;

namespace RevisionAI.Application.Mocks.Queries.GetMockHistory;

public class GetMockHistoryQueryHandler : IRequestHandler<GetMockHistoryQuery, GetMockHistoryResponse>
{
    private readonly IAppDbContext _dbContext;

    public GetMockHistoryQueryHandler(IAppDbContext dbContext)
    {
        _dbContext = dbContext;
    }

    public async Task<GetMockHistoryResponse> Handle(GetMockHistoryQuery request, CancellationToken cancellationToken)
    {
        int page = Math.Max(1, request.Page);
        int pageSize = Math.Clamp(request.PageSize, 1, 100);

        IQueryable<Domain.Entities.MockSession> query = _dbContext.MockSessions
            .AsNoTracking()
            .Where(m => m.UserId == request.UserId && m.CompletedAt != null)
            .OrderByDescending(m => m.CompletedAt);

        int totalCount = await query.CountAsync(cancellationToken);

        List<MockHistoryDto> data = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(m => new MockHistoryDto
            {
                MockSessionId = m.Id,
                StartedAt = m.StartedAt,
                CompletedAt = m.CompletedAt,
                QuestionCount = m.QuestionCount,
                Score = m.Score,
                TimeTakenSeconds = m.CompletedAt.HasValue
                    ? (double?)(m.CompletedAt.Value - m.StartedAt).TotalSeconds
                    : null
            })
            .ToListAsync(cancellationToken);

        return new GetMockHistoryResponse
        {
            Data = data,
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