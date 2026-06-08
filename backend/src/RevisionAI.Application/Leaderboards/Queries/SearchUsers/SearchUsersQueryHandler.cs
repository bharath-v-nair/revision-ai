using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Leaderboards.Dtos;

namespace RevisionAI.Application.Leaderboards.Queries.SearchUsers;

public class SearchUsersQueryHandler : IRequestHandler<SearchUsersQuery, List<UserSearchResultDto>>
{
    private readonly IAppDbContext _context;

    public SearchUsersQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<UserSearchResultDto>> Handle(SearchUsersQuery request, CancellationToken cancellationToken)
    {
        string query = request.Q.Trim();

        if (string.IsNullOrEmpty(query))
        {
            return new List<UserSearchResultDto>();
        }

        List<UserSearchResultDto> results = await _context.Users
            .AsNoTracking()
            .Where(u => u.Email.Contains(query) || u.DisplayName.Contains(query))
            .Take(20)
            .Select(u => new UserSearchResultDto
            {
                UserId = u.Id,
                DisplayName = u.DisplayName,
                Email = u.Email
            })
            .ToListAsync(cancellationToken);

        return results;
    }
}