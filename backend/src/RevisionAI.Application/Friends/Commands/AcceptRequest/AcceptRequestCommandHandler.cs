using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Friends.Commands.AcceptRequest;

public class AcceptRequestCommandHandler : IRequestHandler<AcceptRequestCommand>
{
    private readonly IAppDbContext _context;

    public AcceptRequestCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(AcceptRequestCommand request, CancellationToken cancellationToken)
    {
        Friendship? friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == request.FriendshipId, cancellationToken);

        if (friendship is null)
        {
            throw new InvalidOperationException("Friend request not found.");
        }

        if (friendship.AddresseeId != request.UserId)
        {
            throw new InvalidOperationException("Only the addressee can accept a friend request.");
        }

        if (friendship.Status != "Pending")
        {
            throw new InvalidOperationException("Friend request is not in pending status.");
        }

        // Accept the request
        friendship.Status = "Accepted";
        friendship.AcceptedAt = DateTime.UtcNow;

        // Create reciprocal friendship row for symmetric access
        Friendship reciprocal = new()
        {
            Id = Guid.NewGuid(),
            RequesterId = request.UserId,
            AddresseeId = friendship.RequesterId,
            Status = "Accepted",
            CreatedAt = DateTime.UtcNow,
            AcceptedAt = DateTime.UtcNow
        };

        _context.Add(reciprocal);
        await _context.SaveChangesAsync(cancellationToken);
    }
}