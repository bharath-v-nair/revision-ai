using MediatR;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Auth.Commands.SendOtp;

public class SendOtpCommandHandler : IRequestHandler<SendOtpCommand>
{
    private readonly IOtpService _otpService;

    public SendOtpCommandHandler(IOtpService otpService)
    {
        _otpService = otpService;
    }

    public Task Handle(SendOtpCommand request, CancellationToken cancellationToken)
    {
        string otp = _otpService.GenerateOtp();
        _otpService.StoreOtp(request.Email, otp);
        return Task.CompletedTask;
    }
}