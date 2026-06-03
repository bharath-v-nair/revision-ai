using MediatR;

namespace RevisionAI.Application.Auth.Commands.SendOtp;

public class SendOtpCommand : IRequest
{
    public string Email { get; set; } = string.Empty;
}