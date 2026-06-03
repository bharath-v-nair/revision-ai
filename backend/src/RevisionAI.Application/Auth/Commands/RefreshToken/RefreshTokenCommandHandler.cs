using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Contracts.Auth;
using DomainRefreshToken = RevisionAI.Domain.Entities.RefreshToken;

namespace RevisionAI.Application.Auth.Commands.RefreshToken;

public class RefreshTokenCommandHandler : IRequestHandler<RefreshTokenCommand, AuthResponse>
{
    private readonly IAppDbContext _context;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public RefreshTokenCommandHandler(
        IAppDbContext context,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService)
    {
        _context = context;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<AuthResponse> Handle(RefreshTokenCommand request, CancellationToken cancellationToken)
    {
        // 1. Find refresh token in DB
        DomainRefreshToken? storedToken = await _context.RefreshTokens
            .FirstOrDefaultAsync(rt => rt.Token == request.RefreshToken, cancellationToken);

        if (storedToken is null)
        {
            throw new FluentValidation.ValidationException(
                "Refresh token not found.",
                [new FluentValidation.Results.ValidationFailure("RefreshToken", "Refresh token not found.")]);
        }

        // 2. Check not revoked
        if (storedToken.RevokedAt.HasValue)
        {
            throw new FluentValidation.ValidationException(
                "Refresh token has been revoked.",
                [new FluentValidation.Results.ValidationFailure("RefreshToken", "Refresh token has been revoked.")]);
        }

        // 3. Check not expired
        if (storedToken.ExpiresAt < DateTime.UtcNow)
        {
            throw new FluentValidation.ValidationException(
                "Refresh token has expired.",
                [new FluentValidation.Results.ValidationFailure("RefreshToken", "Refresh token has expired.")]);
        }

        // 4. Revoke old refresh token
        storedToken.RevokedAt = DateTime.UtcNow;

        // 5. Get user
        RevisionAI.Domain.Entities.User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Id == storedToken.UserId, cancellationToken);

        if (user is null)
        {
            throw new FluentValidation.ValidationException(
                "User not found for this refresh token.",
                [new FluentValidation.Results.ValidationFailure("RefreshToken", "User not found for this refresh token.")]);
        }

        // 6. Generate new tokens
        string accessToken = _jwtTokenService.GenerateAccessToken(user);
        DomainRefreshToken newRefreshToken = _refreshTokenService.GenerateRefreshToken(user);
        _context.Add(newRefreshToken);

        await _context.SaveChangesAsync(cancellationToken);

        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = newRefreshToken.Token,
            ExpiresAt = DateTime.UtcNow.AddMinutes(15),
            User = new UserDto
            {
                Id = user.Id,
                Email = user.Email,
                DisplayName = user.DisplayName,
                AvatarUrl = user.AvatarUrl
            }
        };
    }
}