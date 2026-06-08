using MediatR;
using RevisionAI.Application.Friends.Dtos;

namespace RevisionAI.Application.Friends.Commands.SendRequest;

public class SendRequestCommand : IRequest<FriendRequestDto>
{
    public Guid RequesterId { get; set; }
    public string Email { get; set; } = string.Empty;
}