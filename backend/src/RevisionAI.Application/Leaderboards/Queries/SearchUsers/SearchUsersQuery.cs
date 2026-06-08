using MediatR;
using RevisionAI.Application.Leaderboards.Dtos;

namespace RevisionAI.Application.Leaderboards.Queries.SearchUsers;

public class SearchUsersQuery : IRequest<List<UserSearchResultDto>>
{
    public string Q { get; set; } = string.Empty;
}