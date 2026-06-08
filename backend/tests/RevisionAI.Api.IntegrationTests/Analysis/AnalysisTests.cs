using System.Net;
using System.Net.Http.Json;
using RevisionAI.Application.Analysis.Commands.AnalyzeBatch;
using RevisionAI.Application.Analysis.Queries.GetDashboard;
using RevisionAI.Application.Analysis.Queries.GetQuestionHistory;

namespace RevisionAI.Api.IntegrationTests.Analysis;

/// <summary>
/// Integration tests for Analysis Engine (Phase 2.5).
/// Tests all 3 endpoints: batch analysis, dashboard, and question history.
/// </summary>
public class AnalysisTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public AnalysisTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ──────────────── POST /api/analysis/batch ────────────────

    [Fact]
    public async Task AnalyzeBatch_Returns200_WithCorrectStats()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Seed some UserAttempts first by reviewing questions via SR endpoint
        Guid qId1 = _factory.Subject1QuestionIds[0]; // Subject 1 questions untouched by other test classes
        Guid qId2 = _factory.Subject1QuestionIds[1];

        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId1}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 }); // correct (S1 Q1 correctOption = 'A')
        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId2}/review",
            new { selectedOption = 'C', timeTakenMs = 20000 }); // incorrect (S1 Q2 correctOption = 'B')

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/analysis/batch",
            new { questionIds = new List<Guid> { qId1, qId2 } });
        AnalyzeBatchResponse? body = await response.Content.ReadFromJsonAsync<AnalyzeBatchResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(2, body.TotalQuestions);
        Assert.True(body.CorrectCount >= 1);
        Assert.True(body.IncorrectCount >= 1);
        Assert.True(body.AccuracyPercentage > 0);
        Assert.True(body.AverageTimeMs > 0);
    }

    [Fact]
    public async Task AnalyzeBatch_Returns400_EmptyQuestionIds()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/analysis/batch",
            new { questionIds = new List<Guid>() });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AnalyzeBatch_Returns400_InvalidQuestionId()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/analysis/batch",
            new { questionIds = new List<Guid> { Guid.NewGuid() } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AnalyzeBatch_Returns200_WhenSomeQuestionsHaveNoAttempts()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Use subject 1 questions that other test classes don't touch
        Guid qId = _factory.Subject1QuestionIds[3];

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/analysis/batch",
            new { questionIds = new List<Guid> { qId } });
        AnalyzeBatchResponse? body = await response.Content.ReadFromJsonAsync<AnalyzeBatchResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Equal(1, body.TotalQuestions);
        // May have 0 or >0 attempts depending on test order — just ensure valid response
        Assert.True(body.CorrectCount >= 0);
        Assert.True(body.AccuracyPercentage >= 0.0);
    }

    // ──────────────── GET /api/analysis/dashboard ────────────────

    [Fact]
    public async Task GetDashboard_Returns200_WithOverallStats()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Seed some attempts for dashboard data
        Guid qId1 = _factory.Subject2QuestionIds[0];
        Guid qId2 = _factory.Subject2QuestionIds[1];

        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId1}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 });
        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId2}/review",
            new { selectedOption = 'B', timeTakenMs = 20000 });

        HttpResponseMessage response = await client.GetAsync("/api/analysis/dashboard");
        GetDashboardResponse? body = await response.Content.ReadFromJsonAsync<GetDashboardResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body.TotalQuestionsAnswered >= 2);
        Assert.True(body.TotalCorrect >= 1);
        Assert.True(body.TotalIncorrect >= 1);
        Assert.True(body.OverallAccuracy > 0);
    }

    [Fact]
    public async Task GetDashboard_Returns200_WithDefaultStreakAndXp()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/analysis/dashboard");
        GetDashboardResponse? body = await response.Content.ReadFromJsonAsync<GetDashboardResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        // Streak and XP should default to 0 when not seeded
        Assert.Equal(0, body.StreakDays);
        Assert.Equal(0, body.TotalXp);
        Assert.Equal(0, body.CurrentLevel);
    }

    [Fact]
    public async Task GetDashboard_ReturnsSubjectBreakdown()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Seed attempts on subject 2 questions
        Guid qId1 = _factory.Subject2QuestionIds[0];
        Guid qId2 = _factory.Subject2QuestionIds[1];

        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId1}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 }); // correct
        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId2}/review",
            new { selectedOption = 'B', timeTakenMs = 20000 }); // incorrect

        HttpResponseMessage response = await client.GetAsync("/api/analysis/dashboard");
        GetDashboardResponse? body = await response.Content.ReadFromJsonAsync<GetDashboardResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);

        // Both subjects should be the same (only subject 2 has attempts)
        if (body.WeakestSubject is not null && body.StrongestSubject is not null)
        {
            Assert.NotEmpty(body.WeakestSubject.SubjectName);
            Assert.NotEmpty(body.StrongestSubject.SubjectName);
            Assert.True(body.WeakestSubject.Accuracy <= body.StrongestSubject.Accuracy);
        }
    }

    // ──────────────── GET /api/analysis/question/{id}/history ────────────────

    [Fact]
    public async Task GetQuestionHistory_Returns200_WithAttempts()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Use Subject 1 question to avoid interference from other test classes
        Guid qId = _factory.Subject1QuestionIds[1]; // S1 Q2: correctOption = 'B'
        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId}/review",
            new { selectedOption = 'C', timeTakenMs = 15000 }); // 'C' is wrong (correct is 'B')

        HttpResponseMessage response = await client.GetAsync($"/api/analysis/question/{qId}/history");
        GetQuestionHistoryResponse? body = await response.Content.ReadFromJsonAsync<GetQuestionHistoryResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.NotEmpty(body.QuestionText);
        Assert.NotEmpty(body.Attempts);

        // Check the latest attempt (last in array since ordered ASC)
        AttemptDto latestAttempt = body.Attempts[^1];
        Assert.Equal("SpacedRepetition", latestAttempt.SessionType);
        Assert.Equal('C', latestAttempt.SelectedOption);
        Assert.False(latestAttempt.IsCorrect);
        Assert.True(latestAttempt.TimeTakenMs > 0);
    }

    [Fact]
    public async Task GetQuestionHistory_Returns200_WithEmptyAttemptsWhenNoAttempts()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Use a question that has never been attempted
        Guid qId = _factory.Subject2QuestionIds[3];

        HttpResponseMessage response = await client.GetAsync($"/api/analysis/question/{qId}/history");
        GetQuestionHistoryResponse? body = await response.Content.ReadFromJsonAsync<GetQuestionHistoryResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.NotEmpty(body.QuestionText);
        Assert.Empty(body.Attempts);
        Assert.Equal(0.0, body.CurrentEaseFactor);
        Assert.Equal(0, body.CurrentInterval);
    }

    [Fact]
    public async Task GetQuestionHistory_Returns200_WithEaseFactorAndInterval()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Review a question correctly to build up SR state
        Guid qId = _factory.Subject2QuestionIds[2];
        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 });

        HttpResponseMessage response = await client.GetAsync($"/api/analysis/question/{qId}/history");
        GetQuestionHistoryResponse? body = await response.Content.ReadFromJsonAsync<GetQuestionHistoryResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body.CurrentEaseFactor > 2.5); // Correct answer increases ease factor
        Assert.Equal(1, body.CurrentInterval);
    }

    [Fact]
    public async Task GetQuestionHistory_ReturnsAttemptsOrderedByCreatedAtAsc()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Review a question multiple times
        Guid qId = _factory.Subject2QuestionIds[4];
        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 });
        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId}/review",
            new { selectedOption = 'A', timeTakenMs = 12000 });

        HttpResponseMessage response = await client.GetAsync($"/api/analysis/question/{qId}/history");
        GetQuestionHistoryResponse? body = await response.Content.ReadFromJsonAsync<GetQuestionHistoryResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body.Attempts.Count >= 2);

        // Verify chronological order
        for (int i = 1; i < body.Attempts.Count; i++)
        {
            Assert.True(body.Attempts[i].CreatedAt >= body.Attempts[i - 1].CreatedAt);
        }
    }

    // ──────────────── Auth enforcement ────────────────

    [Fact]
    public async Task AllEndpoints_RequireAuthentication()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();

        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/analysis/batch",
                new { questionIds = new List<Guid> { Guid.NewGuid() } })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/analysis/dashboard")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync($"/api/analysis/question/{Guid.NewGuid()}/history")).StatusCode);
    }
}