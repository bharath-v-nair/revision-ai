using System.Net;
using System.Net.Http.Json;
using RevisionAI.Application.Gamification.Commands.CheckAchievements;
using RevisionAI.Application.Gamification.Dtos;

namespace RevisionAI.Api.IntegrationTests.Gamification;

/// <summary>
/// Integration tests for Phase 2.8 — Gamification (Streaks, Achievements, XP).
/// Tests all 6 endpoints: 2 streaks + 3 achievements + 1 xp.
/// </summary>
public class GamificationTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public GamificationTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ═══════════════════════════════════════════════
    // STREAKS — GET /api/streaks
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetStreak_ReturnsDefault_WhenNoStreakExists()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/streaks");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        StreakDto? result = await response.Content.ReadFromJsonAsync<StreakDto>();
        Assert.NotNull(result);
        Assert.Equal(0, result.CurrentStreak);
        Assert.Equal(0, result.LongestStreak);
        Assert.Null(result.LastActivityDate);
        Assert.False(result.IsAtRisk);
    }

    [Fact]
    public async Task GetStreak_RequiresAuthentication()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/streaks");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // STREAKS — POST /api/streaks/tick
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task TickStreak_CreatesNewStreak_WhenFirstTick()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsync("/api/streaks/tick", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        StreakDto? result = await response.Content.ReadFromJsonAsync<StreakDto>();
        Assert.NotNull(result);
        Assert.Equal(1, result.CurrentStreak);
        Assert.Equal(1, result.LongestStreak);
        Assert.NotNull(result.LastActivityDate);
        Assert.False(result.IsAtRisk);
    }

    [Fact]
    public async Task TickStreak_IsIdempotent_SameDay()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // First tick
        await client.PostAsync("/api/streaks/tick", null);

        // Second tick — same day, should be no-op
        HttpResponseMessage response = await client.PostAsync("/api/streaks/tick", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        StreakDto? result = await response.Content.ReadFromJsonAsync<StreakDto>();
        Assert.NotNull(result);
        Assert.Equal(1, result.CurrentStreak); // Still 1
    }

    [Fact]
    public async Task TickStreak_RequiresAuthentication()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.PostAsync("/api/streaks/tick", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // ACHIEVEMENTS — GET /api/achievements
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetAchievements_ReturnsAllDefinitions()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/achievements");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        List<AchievementDto>? result = await response.Content.ReadFromJsonAsync<List<AchievementDto>>();
        Assert.NotNull(result);
        Assert.Equal(12, result.Count); // All 12 definitions

        // All should have valid names
        foreach (AchievementDto a in result)
        {
            Assert.False(string.IsNullOrEmpty(a.Name));
            Assert.False(string.IsNullOrEmpty(a.Type));
            Assert.True(a.ProgressPercent >= 0 && a.ProgressPercent <= 100);
        }
    }

    [Fact]
    public async Task GetAchievements_RequiresAuthentication()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/achievements");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // ACHIEVEMENTS — GET /api/achievements/{id}
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetAchievementDetail_Returns404_WhenNotFound()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        Guid fakeId = Guid.NewGuid();
        HttpResponseMessage response = await client.GetAsync($"/api/achievements/{fakeId}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // ACHIEVEMENTS — POST /api/achievements/check
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task CheckAchievements_ReturnsEmpty_WhenNoProgress()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsync("/api/achievements/check", null);
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        CheckAchievementsResponse? result = await response.Content.ReadFromJsonAsync<CheckAchievementsResponse>();
        Assert.NotNull(result);
        Assert.Empty(result.NewlyUnlocked); // No XP, no streak, no questions — nothing unlocks
    }

    [Fact]
    public async Task CheckAchievements_RequiresAuthentication()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.PostAsync("/api/achievements/check", null);
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // XP — GET /api/xp/summary
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetXpSummary_ReturnsDefault_WhenNoXp()
    {
        // Use TestUser3 (no Xp seeded)
        HttpClient client = _factory.CreateClient();
        string token = _factory.GenerateTestJwt(_factory.TestUser3Id, _factory.TestUser3Email);
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                Microsoft.AspNetCore.Authentication.JwtBearer.JwtBearerDefaults.AuthenticationScheme, token);

        HttpResponseMessage response = await client.GetAsync("/api/xp/summary");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        XpSummaryDto? result = await response.Content.ReadFromJsonAsync<XpSummaryDto>();
        Assert.NotNull(result);
        Assert.Equal(0, result.TotalXp);
        Assert.Equal(1, result.CurrentLevel);
        Assert.Equal(100, result.XpToNextLevel);
        Assert.Empty(result.RecentTransactions);
    }

    [Fact]
    public async Task GetXpSummary_ReturnsSeededXp()
    {
        // TestUser has 500 XP seeded in the factory
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/xp/summary");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        XpSummaryDto? result = await response.Content.ReadFromJsonAsync<XpSummaryDto>();
        Assert.NotNull(result);
        // TestUser has 500 XP → level = floor(500/100) + 1 = 6, xpToNext = (6*100) - 500 = 100
        Assert.Equal(500, result.TotalXp);
        Assert.Equal(6, result.CurrentLevel);
        Assert.Equal(100, result.XpToNextLevel);
    }

    [Fact]
    public async Task GetXpSummary_RequiresAuthentication()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/xp/summary");
        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}