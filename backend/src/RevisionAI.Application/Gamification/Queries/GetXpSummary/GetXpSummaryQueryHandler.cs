using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Gamification.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Gamification.Queries.GetXpSummary;

public class GetXpSummaryQueryHandler : IRequestHandler<GetXpSummaryQuery, XpSummaryDto>
{
    private readonly IAppDbContext _context;

    public GetXpSummaryQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<XpSummaryDto> Handle(GetXpSummaryQuery request, CancellationToken cancellationToken)
    {
        Guid userId = request.UserId;

        UserXp? xp = await _context.UserXp
            .AsNoTracking()
            .FirstOrDefaultAsync(x => x.UserId == userId, cancellationToken);

        int totalXp = xp?.TotalXp ?? 0;
        int currentLevel = (totalXp / 100) + 1;
        int xpToNextLevel = (currentLevel * 100) - totalXp;

        List<XpTransactionDto> recentTransactions = await _context.XpTransactions
            .AsNoTracking()
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.CreatedAt)
            .Take(20)
            .Select(t => new XpTransactionDto
            {
                Id = t.Id,
                Amount = t.Amount,
                Reason = t.Reason,
                QuestionId = t.QuestionId,
                CreatedAt = t.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return new XpSummaryDto
        {
            TotalXp = totalXp,
            CurrentLevel = currentLevel,
            XpToNextLevel = xpToNextLevel,
            RecentTransactions = recentTransactions
        };
    }
}