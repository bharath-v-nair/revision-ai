using System.Security.Cryptography;
using System.Diagnostics.CodeAnalysis;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Services;

public class RefreshTokenService : IRefreshTokenService
{
    [SuppressMessage("Performance", "CA1822:Mark members as static",
        Justification = "Service is registered in DI and requires instance-level access for testability")]
    public RefreshToken GenerateRefreshToken(User user)
    {
        var randomBytes = new byte[64];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomBytes);
        var tokenString = Convert.ToBase64String(randomBytes);

        return new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = user.Id,
            Token = tokenString,
            ExpiresAt = DateTime.UtcNow.AddDays(7),
            CreatedAt = DateTime.UtcNow
        };
    }
}