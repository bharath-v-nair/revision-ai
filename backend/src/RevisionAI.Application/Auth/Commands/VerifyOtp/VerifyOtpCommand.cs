using MediatR;
using RevisionAI.Contracts.Auth;

namespace RevisionAI.Application.Auth.Commands.VerifyOtp;

public class VerifyOtpCommand : IRequest<AuthResponse>
{
    public string Email { get; set; } = string.Empty;
    public string Otp { get; set; } = string.Empty;
}