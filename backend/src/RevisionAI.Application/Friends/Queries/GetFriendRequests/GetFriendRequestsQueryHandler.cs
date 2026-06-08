using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Friends.Dtos;

namespace RevisionAI.Application.Friends.Queries.GetFriendRequests;

public class GetFriendRequestsQueryHandler : IRequestHandler<GetFriendRequestsQuery, List<FriendRequestDto>>
{
    private readonly IAppDbContext _context;

    public GetFriendRequestsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FriendRequestDto>> Handle(GetFriendRequestsQuery request, CancellationToken cancellationToken)
    {
        List<FriendRequestDto> requests = await _context.Friendships
            .AsNoTracking()
            .Where(f => f.AddresseeId == request.UserId && f.Status == "Pending")
            .Join(
                _context.Users.AsNoTracking(),
                f => f.RequesterId,
                u => u.Id,
                (f, u) => new FriendRequestDto
                {
                    Id = f.Id,
                    RequesterId = f.RequesterId,
                    RequesterDisplayName = u.DisplayName,
                    RequesterEmail = u.Email,
                    CreatedAt = f.CreatedAt
                })
            .OrderByDescending(r => r.CreatedAt)
            .ToListAsync(cancellationToken);

        return requests;
    }
}