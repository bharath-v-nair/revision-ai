using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Auth.Commands.GoogleLogin;
using RevisionAI.Application.Auth.Commands.RefreshToken;
using RevisionAI.Application.Auth.Commands.SendOtp;
using RevisionAI.Application.Auth.Commands.VerifyOtp;
using RevisionAI.Contracts.Auth;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/auth")]
[AllowAnonymous]
public class AuthController : ControllerBase
{
    private readonly IMediator _mediator;

    public AuthController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>Login with Google ID token</summary>
    [HttpPost("google")]
    public async Task<ActionResult<AuthResponse>> GoogleLogin(
        [FromBody] GoogleLoginRequest request,
        CancellationToken cancellationToken)
    {
        var command = new GoogleLoginCommand { IdToken = request.IdToken };
        AuthResponse result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>Send OTP to email (dev: logged to console)</summary>
    [HttpPost("email/send-otp")]
    public async Task<ActionResult> SendOtp(
        [FromBody] SendOtpRequest request,
        CancellationToken cancellationToken)
    {
        var command = new SendOtpCommand { Email = request.Email };
        await _mediator.Send(command, cancellationToken);
        return Ok(new { message = "OTP sent." });
    }

    /// <summary>Verify OTP and get auth tokens</summary>
    [HttpPost("email/verify-otp")]
    public async Task<ActionResult<AuthResponse>> VerifyOtp(
        [FromBody] VerifyOtpRequest request,
        CancellationToken cancellationToken)
    {
        var command = new VerifyOtpCommand
        {
            Email = request.Email,
            Otp = request.Otp
        };
        AuthResponse result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>Refresh access token using refresh token (rotation)</summary>
    [HttpPost("refresh")]
    public async Task<ActionResult<AuthResponse>> Refresh(
        [FromBody] RefreshRequest request,
        CancellationToken cancellationToken)
    {
        var command = new RefreshTokenCommand { RefreshToken = request.RefreshToken };
        AuthResponse result = await _mediator.Send(command, cancellationToken);
        return Ok(result);
    }

    /// <summary>Logout - revoke refresh token</summary>
    [HttpPost("logout")]
    public async Task<ActionResult> Logout(
        [FromBody] RefreshRequest request,
        CancellationToken cancellationToken)
    {
        var command = new RefreshTokenCommand { RefreshToken = request.RefreshToken };
        await _mediator.Send(command, cancellationToken);
        return Ok(new { message = "Logged out." });
    }
}