using FluentValidation;
using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Contracts.Auth;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Auth.Commands.VerifyOtp;

public class VerifyOtpCommandHandler : IRequestHandler<VerifyOtpCommand, AuthResponse>
{
    private readonly IAppDbContext _context;
    private readonly IOtpService _otpService;
    private readonly IJwtTokenService _jwtTokenService;
    private readonly IRefreshTokenService _refreshTokenService;

    public VerifyOtpCommandHandler(
        IAppDbContext context,
        IOtpService otpService,
        IJwtTokenService jwtTokenService,
        IRefreshTokenService refreshTokenService)
    {
        _context = context;
        _otpService = otpService;
        _jwtTokenService = jwtTokenService;
        _refreshTokenService = refreshTokenService;
    }

    public async Task<AuthResponse> Handle(VerifyOtpCommand request, CancellationToken cancellationToken)
    {
        // 1. Validate OTP
        bool isValid = _otpService.ValidateOtp(request.Email, request.Otp);
        if (!isValid)
        {
            throw new ValidationException(
                "Invalid or expired OTP.",
                [new FluentValidation.Results.ValidationFailure("Otp", "Invalid or expired OTP.")]);
        }

        // 2. Invalidate OTP after successful validation
        _otpService.InvalidateOtp(request.Email);

        // 3. Find or create user by email
        User? user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);

        if (user is null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Email = request.Email,
                DisplayName = request.Email.Split('@')[0],
                CreatedAt = DateTime.UtcNow
            };
            _context.Add(user);
        }

        // 4. Generate tokens
        string accessToken = _jwtTokenService.GenerateAccessToken(user);
        Domain.Entities.RefreshToken refreshToken = _refreshTokenService.GenerateRefreshToken(user);
        _context.Add(refreshToken);

        await _context.SaveChangesAsync(cancellationToken);

        // 5. Return AuthResponse
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