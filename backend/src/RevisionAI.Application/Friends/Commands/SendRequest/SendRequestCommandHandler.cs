using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Friends.Dtos;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Friends.Commands.SendRequest;

public class SendRequestCommandHandler : IRequestHandler<SendRequestCommand, FriendRequestDto>
{
    private readonly IAppDbContext _context;

    public SendRequestCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<FriendRequestDto> Handle(SendRequestCommand request, CancellationToken cancellationToken)
    {
        // Check for self-request
        User? currentUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Id == request.RequesterId, cancellationToken);

        if (currentUser is null)
        {
            throw new InvalidOperationException("Current user not found.");
        }

        if (string.Equals(currentUser.Email, request.Email, StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("Cannot send a friend request to yourself.");
        }

        // Find target user by email
        User? targetUser = await _context.Users
            .AsNoTracking()
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (targetUser is null)
        {
            throw new InvalidOperationException("User not found.");
        }

        // Check for existing friendship in either direction
        Friendship? existingFriendship = await _context.Friendships
            .AsNoTracking()
            .FirstOrDefaultAsync(f =>
                (f.RequesterId == request.RequesterId && f.AddresseeId == targetUser.Id) ||
                (f.RequesterId == targetUser.Id && f.AddresseeId == request.RequesterId),
                cancellationToken);

        if (existingFriendship is not null)
        {
            throw new InvalidOperationException("A friend request or friendship already exists between these users.");
        }

        Friendship friendship = new()
        {
            Id = Guid.NewGuid(),
            RequesterId = request.RequesterId,
            AddresseeId = targetUser.Id,
            Status = "Pending",
            CreatedAt = DateTime.UtcNow
        };

        _context.Add(friendship);
        await _context.SaveChangesAsync(cancellationToken);

        return new FriendRequestDto
        {
            Id = friendship.Id,
            RequesterId = friendship.RequesterId,
            RequesterDisplayName = currentUser.DisplayName,
            RequesterEmail = currentUser.Email,
            CreatedAt = friendship.CreatedAt
        };
    }
}