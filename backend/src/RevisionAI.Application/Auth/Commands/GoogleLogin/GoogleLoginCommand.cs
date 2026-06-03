using MediatR;
using RevisionAI.Contracts.Auth;

namespace RevisionAI.Application.Auth.Commands.GoogleLogin;

public class GoogleLoginCommand : IRequest<AuthResponse>
{
    public string IdToken { get; set; } = string.Empty;
}