using MediatR;
using RevisionAI.Contracts.Auth;

namespace RevisionAI.Application.Auth.Commands.RefreshToken;

public class RefreshTokenCommand : IRequest<AuthResponse>
{
    public string RefreshToken { get; set; } = string.Empty;
}