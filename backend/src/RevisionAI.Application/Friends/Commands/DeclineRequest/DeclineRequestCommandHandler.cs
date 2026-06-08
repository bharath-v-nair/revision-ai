using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Friends.Commands.DeclineRequest;

public class DeclineRequestCommandHandler : IRequestHandler<DeclineRequestCommand>
{
    private readonly IAppDbContext _context;

    public DeclineRequestCommandHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task Handle(DeclineRequestCommand request, CancellationToken cancellationToken)
    {
        Friendship? friendship = await _context.Friendships
            .FirstOrDefaultAsync(f => f.Id == request.FriendshipId, cancellationToken);

        if (friendship is null)
        {
            throw new InvalidOperationException("Friend request not found.");
        }

        if (friendship.AddresseeId != request.UserId)
        {
            throw new InvalidOperationException("Only the addressee can decline a friend request.");
        }

        if (friendship.Status != "Pending")
        {
            throw new InvalidOperationException("Friend request is not in pending status.");
        }

        friendship.Status = "Declined";
        await _context.SaveChangesAsync(cancellationToken);
    }
}