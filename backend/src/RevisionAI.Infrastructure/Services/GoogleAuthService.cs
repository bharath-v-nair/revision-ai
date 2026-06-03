using System.Net.Http.Json;
using System.Text.Json.Serialization;
using Microsoft.Extensions.Configuration;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Infrastructure.Services;

public class GoogleAuthService : IGoogleAuthService
{
    private readonly HttpClient _httpClient;
    private readonly IConfiguration _configuration;

    public GoogleAuthService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _configuration = configuration;
    }

    public async Task<GoogleUserInfo> ValidateGoogleToken(string idToken)
    {
        HttpResponseMessage response = await _httpClient.GetAsync(
            $"https://oauth2.googleapis.com/tokeninfo?id_token={Uri.EscapeDataString(idToken)}");

        if (!response.IsSuccessStatusCode)
        {
            throw new InvalidOperationException($"Google token validation failed: {response.StatusCode}");
        }

        GoogleTokenInfoPayload? payload = await response.Content.ReadFromJsonAsync<GoogleTokenInfoPayload>();

        if (payload is null || string.IsNullOrEmpty(payload.Email))
        {
            throw new InvalidOperationException("Invalid Google token response: missing email claim.");
        }

        return new GoogleUserInfo(
            GoogleId: payload.Sub,
            Email: payload.Email,
            Name: payload.Name ?? "",
            Picture: payload.Picture
        );
    }

    private sealed class GoogleTokenInfoPayload
    {
        [JsonPropertyName("sub")]
        public string Sub { get; set; } = string.Empty;

        [JsonPropertyName("email")]
        public string Email { get; set; } = string.Empty;

        [JsonPropertyName("name")]
        public string? Name { get; set; }

        [JsonPropertyName("picture")]
        public string? Picture { get; set; }
    }
}