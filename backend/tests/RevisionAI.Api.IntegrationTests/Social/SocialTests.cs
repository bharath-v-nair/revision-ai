using System.Net;
using System.Net.Http.Json;
using RevisionAI.Application.Friends.Dtos;
using RevisionAI.Application.Leaderboards.Dtos;

namespace RevisionAI.Api.IntegrationTests.Social;

/// <summary>
/// Integration tests for Phase 2.7 — Social Features (Friends & Leaderboards).
/// Tests all 10 endpoints: 6 friends + 4 leaderboards.
/// Note: Exception handling middleware not configured, so InvalidOperationException → 500.
/// </summary>
public class SocialTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public SocialTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ═══════════════════════════════════════════════
    // FRIENDS — POST /api/friends/request
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task SendRequest_Returns201_WhenValid()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // User3 exists in seed data and has no existing friendship
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/friends/request",
            new { email = _factory.TestUser3Email });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);

        FriendRequestDto? result = await response.Content.ReadFromJsonAsync<FriendRequestDto>();
        Assert.NotNull(result);
        Assert.Equal(_factory.TestUserId, result.RequesterId);
        Assert.Equal(_factory.TestUserEmail, result.RequesterEmail);
    }

    [Fact]
    public async Task SendRequest_ReturnsRpc_WhenAlreadyExists()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Seed has TestUserId→TestUser2Id already pending
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/friends/request",
            new { email = _factory.TestUser2Email });

        // InvalidOperationException → 500 (no custom exception middleware)
        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task SendRequest_ReturnsError_WhenSelfRequest()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/friends/request",
            new { email = _factory.TestUserEmail });

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task SendRequest_ReturnsError_WhenUserNotFound()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/friends/request",
            new { email = "nonexistent@nowhere.com" });

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task SendRequest_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/friends/request",
            new { email = _factory.TestUser2Email });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // FRIENDS — GET /api/friends/requests (incoming)
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetFriendRequests_Returns200_EmptyList()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Seed: TestUserId→TestUser2Id Pending (TestUserId=requester, not addressee)
        HttpResponseMessage response = await client.GetAsync("/api/friends/requests");

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        List<FriendRequestDto>? requests = await response.Content.ReadFromJsonAsync<List<FriendRequestDto>>();
        Assert.NotNull(requests);
        Assert.Empty(requests);
    }

    [Fact]
    public async Task GetFriendRequests_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/friends/requests");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // FRIENDS — POST /api/friends/requests/{id}/accept
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task AcceptRequest_ReturnsError_WhenNotFound()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsync(
            $"/api/friends/requests/{Guid.NewGuid()}/accept", null);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task AcceptRequest_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.PostAsync(
            $"/api/friends/requests/{Guid.NewGuid()}/accept", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // FRIENDS — POST /api/friends/requests/{id}/decline
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task DeclineRequest_ReturnsError_WhenNotFound()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsync(
            $"/api/friends/requests/{Guid.NewGuid()}/decline", null);

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task DeclineRequest_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.PostAsync(
            $"/api/friends/requests/{Guid.NewGuid()}/decline", null);

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // FRIENDS — GET /api/friends (accepted)
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetFriends_Returns200_EmptyWhenOnlyPending()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Only a Pending friendship in seed → no accepted friends
        HttpResponseMessage response = await client.GetAsync("/api/friends");
        List<FriendDto>? friends = await response.Content.ReadFromJsonAsync<List<FriendDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(friends);
        Assert.Empty(friends);
    }

    [Fact]
    public async Task GetFriends_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/friends");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // FRIENDS — DELETE /api/friends/{id}
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task Unfriend_ReturnsError_WhenNotFound()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.DeleteAsync(
            $"/api/friends/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.InternalServerError, response.StatusCode);
    }

    [Fact]
    public async Task Unfriend_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.DeleteAsync(
            $"/api/friends/{Guid.NewGuid()}");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // LEADERBOARDS — GET /api/leaderboards/friends
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetFriendsLeaderboard_Returns200_IncludesSelf()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/leaderboards/friends");
        List<LeaderboardEntryDto>? entries = await response.Content.ReadFromJsonAsync<List<LeaderboardEntryDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(entries);
        Assert.NotEmpty(entries);
        LeaderboardEntryDto? self = entries.FirstOrDefault(e => e.UserId == _factory.TestUserId);
        Assert.NotNull(self);
        Assert.Equal(1, self.Rank);
        Assert.Equal(500, self.TotalXp);
        Assert.Equal(3, self.CurrentLevel);
    }

    [Fact]
    public async Task GetFriendsLeaderboard_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/leaderboards/friends");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // LEADERBOARDS — GET /api/leaderboards/global
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetGlobalLeaderboard_Returns200_RankedByXp()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync(
            "/api/leaderboards/global?page=1&pageSize=10");
        List<LeaderboardEntryDto>? entries = await response.Content.ReadFromJsonAsync<List<LeaderboardEntryDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(entries);
        Assert.NotEmpty(entries);
        Assert.Contains(entries, e => e.DisplayName == "Test User" && e.TotalXp == 500);
        Assert.Contains(entries, e => e.DisplayName == "User Two" && e.TotalXp == 300);
    }

    [Fact]
    public async Task GetGlobalLeaderboard_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/leaderboards/global");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // LEADERBOARDS — GET /api/leaderboards/weekly
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task GetWeeklyLeaderboard_Returns200_EmptyWhenNoTransactions()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // No XpTransactions seeded → empty result
        HttpResponseMessage response = await client.GetAsync(
            "/api/leaderboards/weekly?page=1&pageSize=10");
        List<LeaderboardEntryDto>? entries = await response.Content.ReadFromJsonAsync<List<LeaderboardEntryDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(entries);
        Assert.Empty(entries);
    }

    [Fact]
    public async Task GetWeeklyLeaderboard_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/leaderboards/weekly");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    // ═══════════════════════════════════════════════
    // LEADERBOARDS — GET /api/users/search
    // ═══════════════════════════════════════════════

    [Fact]
    public async Task SearchUsers_Returns200_ByName()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/users/search?q=User");
        List<UserSearchResultDto>? results = await response.Content.ReadFromJsonAsync<List<UserSearchResultDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(results);
        Assert.NotEmpty(results);
        Assert.Contains(results, r => r.DisplayName == "Test User");
        Assert.Contains(results, r => r.DisplayName == "User Two");
    }

    [Fact]
    public async Task SearchUsers_Returns200_ByEmail()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync(
            $"/api/users/search?q={Uri.EscapeDataString(_factory.TestUser2Email)}");
        List<UserSearchResultDto>? results = await response.Content.ReadFromJsonAsync<List<UserSearchResultDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(results);
        Assert.NotEmpty(results);
        Assert.Single(results);
        Assert.Equal(_factory.TestUser2Email, results[0].Email);
    }

    [Fact]
    public async Task SearchUsers_Returns200_EmptyWhenNoMatches()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/users/search?q=zzzznonexistent");
        List<UserSearchResultDto>? results = await response.Content.ReadFromJsonAsync<List<UserSearchResultDto>>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(results);
        Assert.Empty(results);
    }

    [Fact]
    public async Task SearchUsers_Returns401_Unauthenticated()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/users/search?q=User");

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }
}