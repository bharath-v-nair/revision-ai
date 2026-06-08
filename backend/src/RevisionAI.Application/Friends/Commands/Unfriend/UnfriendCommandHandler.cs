using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Friends.Commands.Unfriend;

public class UnfriendCommandHandler : IRequestHandler<UnfriendCommand>
{
    private readonly IAppDbContext _context;

    public UnfriendCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(UnfriendCommand request, CancellationToken cancellationToken)
    {
        Friendship? friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == request.FriendshipId, cancellationToken);

        if (friendship is null)
        {
            throw new InvalidOperationException("Friendship not found.");
        }

        if (friendship.Status != "Accepted")
        {
            throw new InvalidOperationException("Friendship is not in accepted status.");
        }

        if (friendship.RequesterId != request.UserId && friendship.AddresseeId != request.UserId)
        {
            throw new InvalidOperationException("User is not part of this friendship.");
        }

        Guid userA = friendship.RequesterId;
        Guid userB = friendship.AddresseeId;

        // Find both sides of the friendship
        List<Friendship> bothRows = await _context.Friendships
            .Where(f =>
                (f.RequesterId == userA && f.AddresseeId == userB) ||
                (f.RequesterId == userB && f.AddresseeId == userA))
            .ToListAsync(cancellationToken);

        foreach (Friendship row in bothRows)
        {
            _context.Friendships.Remove(row);
        }

        await _context.SaveChangesAsync(cancellationToken);
    }
}