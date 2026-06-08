using MediatR;

namespace RevisionAI.Application.Friends.Commands.Unfriend;

public class UnfriendCommand : IRequest
{
    public Guid UserId { get; set; }
    public Guid FriendshipId { get; set; }
}