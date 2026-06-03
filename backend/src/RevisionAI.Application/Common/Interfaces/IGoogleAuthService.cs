namespace RevisionAI.Application.Common.Interfaces;

public interface IGoogleAuthService
{
    Task<GoogleUserInfo> ValidateGoogleToken(string idToken);
}

public sealed record GoogleUserInfo(
    string GoogleId,
    string Email,
    string Name,
    string? Picture
);