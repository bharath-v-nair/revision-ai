using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Bookmarks.Queries.GetCollections;

public class GetCollectionsQueryHandler : IRequestHandler<GetCollectionsQuery, List<GetCollectionsResponse>>
{
    private readonly IAppDbContext _context;

    public GetCollectionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GetCollectionsResponse>> Handle(GetCollectionsQuery request, CancellationToken cancellationToken)
    {
        List<GetCollectionsResponse> collections = await _context.BookmarkCollections
            .AsNoTracking()
            .Where(c => c.UserId == request.UserId)
            .Select(c => new GetCollectionsResponse
            {
                Id = c.Id,
                Name = c.Name,
                Icon = c.Icon,
                ItemCount = c.Items.Count,
                CreatedAt = c.CreatedAt
            })
            .OrderByDescending(c => c.CreatedAt)
            .ToListAsync(cancellationToken);

        return collections;
    }
}