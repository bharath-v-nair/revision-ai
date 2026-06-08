using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Friends.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Friends.Queries.GetFriends;

public class GetFriendsQueryHandler : IRequestHandler<GetFriendsQuery, List<FriendDto>>
{
    private readonly IAppDbContext _context;

    public GetFriendsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<FriendDto>> Handle(GetFriendsQuery request, CancellationToken cancellationToken)
    {
        // Get accepted friendships where current user is the requester
        List<Guid> friendIds = await _context.Friendships
            .AsNoTracking()
            .Where(f => f.RequesterId == request.UserId && f.Status == "Accepted")
            .OrderBy(f => f.CreatedAt)
            .Select(f => f.AddresseeId)
            .ToListAsync(cancellationToken);

        if (friendIds.Count == 0)
        {
            return new List<FriendDto>();
        }

        // Get friendship created dates for each friend
        Dictionary<Guid, DateTime> friendSinceMap = await _context.Friendships
            .AsNoTracking()
            .Where(f => f.RequesterId == request.UserId && friendIds.Contains(f.AddresseeId) && f.Status == "Accepted")
            .ToDictionaryAsync(f => f.AddresseeId, f => f.CreatedAt, cancellationToken);

        // Get user profiles for friends
        List<User> users = await _context.Users
            .AsNoTracking()
            .Where(u => friendIds.Contains(u.Id))
            .ToListAsync(cancellationToken);

        // Get XP data for friends
        List<UserXp> xpEntries = await _context.UserXp
            .AsNoTracking()
            .Where(xp => friendIds.Contains(xp.UserId))
            .ToListAsync(cancellationToken);

        // Build the result
        var friends = users.Select(u =>
        {
            UserXp? xp = xpEntries.FirstOrDefault(x => x.UserId == u.Id);
            friendSinceMap.TryGetValue(u.Id, out DateTime since);

            return new FriendDto
            {
                Id = Guid.NewGuid(),
                UserId = u.Id,
                DisplayName = u.DisplayName,
                Email = u.Email,
                TotalXp = xp?.TotalXp ?? 0,
                CurrentLevel = xp?.CurrentLevel ?? 1,
                FriendsSince = since
            };
        })
        .OrderBy(x => x.DisplayName)
        .ToList();

        return friends;
    }
}