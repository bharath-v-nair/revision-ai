using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Contracts.Auth;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Auth.Commands.GoogleLogin;

public class GoogleLoginCommandHandler : IRequestHandler<GoogleLoginCommand, AuthResponse>
{
    private readonly IAppDbContext _context;
    private readonly IGoogleAuthService _googleAuthService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public GoogleLoginCommandHandler(
        IAppDbContext context,
        IGoogleAuthService googleAuthService,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService)
    {
        _context = context;
        _googleAuthService = googleAuthService;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<AuthResponse> Handle(GoogleLoginCommand request, CancellationToken cancellationToken)
    {
        // 1. Verify Google ID token
        GoogleUserInfo googleUser = await _googleAuthService.ValidateGoogleToken(request.IdToken);

        // 2. Find user by GoogleId OR Email
        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.GoogleId == googleUser.GoogleId || u.Email == googleUser.Email, cancellationToken);

        if (user is null)
        {
            // Create new user
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = googleUser.Email,
                DisplayName = googleUser.Name,
                AvatarUrl = googleUser.Picture,
                GoogleId = googleUser.GoogleId,
                CreatedAt = DateTime.UtcNow
            };
            _context.Add(user);
        }
        else
        {
            // Update existing user with latest Google info if needed
            if (!string.IsNullOrEmpty(googleUser.Name))
            {
                user.DisplayName = googleUser.Name;
            }
            if (!string.IsNullOrEmpty(googleUser.Picture))
            {
                user.AvatarUrl = googleUser.Picture;
            }
            if (string.IsNullOrEmpty(user.GoogleId))
            {
                user.GoogleId = googleUser.GoogleId;
            }
        }

        // 3. Generate tokens
        string accessToken = _jwtTokenService.GenerateAccessToken(user);
        Domain.Entities.RefreshToken refreshToken = _refreshTokenService.GenerateRefreshToken(user);
        _context.Add(refreshToken);

        await _context.SaveChangesAsync(cancellationToken);

        // 4. Return AuthResponse
        return new AuthResponse
        {
            AccessToken = accessToken,
            RefreshToken = refreshToken.Token,
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