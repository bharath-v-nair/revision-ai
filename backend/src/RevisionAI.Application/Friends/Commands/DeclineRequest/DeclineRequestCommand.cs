using MediatR;

namespace RevisionAI.Application.Friends.Commands.DeclineRequest;

public class DeclineRequestCommand : IRequest
{
    public Guid FriendshipId { get; set; }
    public Guid UserId { get; set; }
}