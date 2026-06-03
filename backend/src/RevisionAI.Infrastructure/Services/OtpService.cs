using System.Diagnostics.CodeAnalysis;
using System.Globalization;
using Microsoft.Extensions.Caching.Memory;
using RevisionAI.Application.Common.Interfaces;
using Serilog;

namespace RevisionAI.Infrastructure.Services;

public class OtpService : IOtpService
{
    private readonly IMemoryCache _cache;
    private static readonly TimeSpan OtpExpiry = TimeSpan.FromMinutes(5);

    public OtpService(IMemoryCache cache)
    {
        _cache = cache;
    }

    [SuppressMessage("Performance", "CA1822:Mark members as static",
        Justification = "Service is registered in DI and requires instance-level access for testability")]
    public string GenerateOtp() => Random.Shared.Next(100000, 999999).ToString(CultureInfo.InvariantCulture);

    public void StoreOtp(string email, string otp)
    {
        var cacheKey = GetOtpCacheKey(email);
        var options = new MemoryCacheEntryOptions
        {
            SlidingExpiration = OtpExpiry
        };
        _cache.Set(cacheKey, otp, options);
        Log.Information("[DEV OTP] OTP for {Email}: {Otp}", email, otp);
    }

    public bool ValidateOtp(string email, string otp)
    {
        var cacheKey = GetOtpCacheKey(email);
        bool found = _cache.TryGetValue(cacheKey, out string? storedOtp);
        if (!found || storedOtp is null)
        {
            return false;
        }
        return storedOtp == otp;
    }

    public void InvalidateOtp(string email)
    {
        var cacheKey = GetOtpCacheKey(email);
        _cache.Remove(cacheKey);
    }

    private static string GetOtpCacheKey(string email) =>
        $"otp:{email.Trim().ToLowerInvariant()}";
}