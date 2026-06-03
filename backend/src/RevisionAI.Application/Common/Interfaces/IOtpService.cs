namespace RevisionAI.Application.Common.Interfaces;

public interface IOtpService
{
    string GenerateOtp();
    void StoreOtp(string email, string otp);
    bool ValidateOtp(string email, string otp);
    void InvalidateOtp(string email);
}