using MediatR;

namespace RevisionAI.Application.Friends.Commands.AcceptRequest;

public class AcceptRequestCommand : IRequest
{
    public Guid FriendshipId { get; set; }
    public Guid UserId { get; set; }
}