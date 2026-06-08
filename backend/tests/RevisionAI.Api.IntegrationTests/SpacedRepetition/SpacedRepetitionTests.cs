using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using RevisionAI.Application.SpacedRepetition.Commands.ReviewQuestion;
using RevisionAI.Application.SpacedRepetition.Queries.GetDueQuestions;
using RevisionAI.Application.SpacedRepetition.Queries.GetSpacedRepetitionStats;

namespace RevisionAI.Api.IntegrationTests.SpacedRepetition;

/// <summary>
/// Integration tests for Spaced Repetition Engine (Phase 2.4).
/// Uses Subject 2 only — all correct answers are 'A' for deterministic assertions.
/// Tests avoid InMemory EF navigation property projections (known limitation).
/// For full coverage with real DB, upgrade to Testcontainers.PostgreSql.
/// 
/// Important: IClassFixture shares factory across all tests in this class.
/// Tests that create schedules use distinct question IDs to avoid cross-test pollution.
/// </summary>
public class SpacedRepetitionTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public SpacedRepetitionTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    // ──────────────── GET /api/spaced-repetition/due ────────────────

    [Fact]
    public async Task GetDueQuestions_Returns200_EmptyWhenNoSchedules()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/spaced-repetition/due?page=1&pageSize=20");
        GetDueQuestionsResponse? body = await response.Content.ReadFromJsonAsync<GetDueQuestionsResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.Empty(body.Data);
        Assert.Equal(1, body.Meta.Page);
        Assert.Equal(20, body.Meta.PageSize);
        Assert.Equal(0, body.Meta.TotalCount);
        Assert.False(body.Meta.HasNext);
    }

    [Fact]
    public async Task GetDueQuestions_HidesCorrectOptionAndExplanation()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Create a schedule via review
        Guid questionId = _factory.Subject2QuestionIds[4];
        await client.PostAsJsonAsync($"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 });

        HttpResponseMessage response = await client.GetAsync("/api/spaced-repetition/due");
        string rawJson = await response.Content.ReadAsStringAsync();
        JsonDocument json = JsonDocument.Parse(rawJson);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);

        // Verify the response JSON does NOT expose correctOption or explanation
        // at the top level of any due question item
        Assert.False(json.RootElement.TryGetProperty("correctOption", out _));
        Assert.False(json.RootElement.TryGetProperty("explanation", out _));

        // If data exists, each question in data must also not expose correctOption/explanation
        JsonElement data = json.RootElement.GetProperty("data");
        for (int i = 0; i < data.GetArrayLength(); i++)
        {
            JsonElement item = data[i];
            Assert.False(item.TryGetProperty("correctOption", out _));
            Assert.False(item.TryGetProperty("explanation", out _));

            JsonElement questionElement = item.GetProperty("question");
            Assert.False(questionElement.TryGetProperty("correctOption", out _));
            Assert.False(questionElement.TryGetProperty("explanation", out _));
        }
    }

    [Fact]
    public async Task GetDueQuestions_Returns200_AndPaginationMeta()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/spaced-repetition/due?page=1&pageSize=20");
        GetDueQuestionsResponse? body = await response.Content.ReadFromJsonAsync<GetDueQuestionsResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.NotNull(body.Meta);
        Assert.Equal(1, body.Meta.Page);
        Assert.Equal(20, body.Meta.PageSize);
    }

    // ──────────────── POST /api/spaced-repetition/{id}/review ────────────────

    [Fact]
    public async Task ReviewQuestion_ReturnsCorrectnessAndExplanation_Correct()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        Guid questionId = _factory.Subject2QuestionIds[3]; // CorrectOption = 'A'

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'A', timeTakenMs = 15000 });
        ReviewQuestionResponse? body = await response.Content.ReadFromJsonAsync<ReviewQuestionResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body.IsCorrect);
        Assert.Equal('A', body.CorrectOption);
        Assert.NotEmpty(body.Explanation);
        Assert.True(body.NewEaseFactor > 2.5); // Increased for correct answer
        Assert.Equal(1, body.NewInterval);
        Assert.True(body.NextReviewDate > DateTime.MinValue);
    }

    [Fact]
    public async Task ReviewQuestion_ReturnsCorrectnessAndExplanation_Incorrect()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        Guid questionId = _factory.Subject2QuestionIds[4]; // CorrectOption = 'A'

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'B', timeTakenMs = 15000 });
        ReviewQuestionResponse? body = await response.Content.ReadFromJsonAsync<ReviewQuestionResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.False(body.IsCorrect);
        Assert.Equal('A', body.CorrectOption); // Reveals correct answer
        Assert.NotEmpty(body.Explanation);      // Reveals explanation
        Assert.True(body.NewEaseFactor < 3.0); // Decreased from default
        Assert.True(body.NewEaseFactor >= 1.3); // Never below floor
        Assert.Equal(1, body.NewInterval);
    }

    [Fact]
    public async Task ReviewQuestion_UpdatesExistingSchedule()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        Guid questionId = _factory.Subject2QuestionIds[2]; // Untouched by other tests

        // First review: correct (should create initial schedule, interval=1)
        HttpResponseMessage first = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 });
        ReviewQuestionResponse? firstBody = await first.Content.ReadFromJsonAsync<ReviewQuestionResponse>();
        Assert.NotNull(firstBody);
        Assert.True(firstBody.IsCorrect);
        Assert.Equal(1, firstBody.NewInterval);

        // Second review: also correct (should update — interval=6 per SM-2)
        HttpResponseMessage second = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 });
        ReviewQuestionResponse? secondBody = await second.Content.ReadFromJsonAsync<ReviewQuestionResponse>();

        Assert.Equal(HttpStatusCode.OK, second.StatusCode);
        Assert.NotNull(secondBody);
        Assert.True(secondBody.IsCorrect);
        Assert.True(secondBody.NewInterval > 1); // Interval increases on second correct review
        Assert.True(secondBody.NewEaseFactor >= firstBody.NewEaseFactor);
    }

    [Fact]
    public async Task ReviewQuestion_Returns400_WhenQuestionNotFound()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{Guid.NewGuid()}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    // ──────────────── GET /api/spaced-repetition/stats ────────────────

    [Fact]
    public async Task GetStats_Returns200_AfterReviews()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();

        // Review 1 question to ensure there's at least some data
        Guid qId = _factory.Subject2QuestionIds[0];
        await client.PostAsJsonAsync($"/api/spaced-repetition/{qId}/review",
            new { selectedOption = 'A', timeTakenMs = 10000 });

        HttpResponseMessage response = await client.GetAsync("/api/spaced-repetition/stats");
        GetSpacedRepetitionStatsResponse? body = await response.Content.ReadFromJsonAsync<GetSpacedRepetitionStatsResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.True(body.TotalScheduled >= 1);
        Assert.True(body.TotalReviews >= 1);
        Assert.True(body.AverageEaseFactor > 0);
    }

    [Fact]
    public async Task GetStats_Returns200_EvenWithNoData()
    {
        // This test may have data from other tests; that's fine — just verify 200
        HttpClient client = _factory.CreateAuthenticatedClient();

        HttpResponseMessage response = await client.GetAsync("/api/spaced-repetition/stats");
        GetSpacedRepetitionStatsResponse? body = await response.Content.ReadFromJsonAsync<GetSpacedRepetitionStatsResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
    }

    // ──────────────── Auth enforcement ────────────────

    [Fact]
    public async Task AllEndpoints_RequireAuthentication()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();
        Guid questionId = _factory.Subject2QuestionIds[0];

        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/spaced-repetition/due")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync($"/api/spaced-repetition/{questionId}/review",
                new { selectedOption = 'A', timeTakenMs = 10000 })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/spaced-repetition/stats")).StatusCode);
    }

    // ──────────────── SM-2 Algorithm Validation ────────────────

    [Fact]
    public async Task ReviewQuestion_Sm2EaseFactor_CapsAtMaximum()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        Guid questionId = _factory.Subject2QuestionIds[0];

        // Answer correctly many times to drive ease factor up
        for (int i = 0; i < 7; i++)
        {
            HttpResponseMessage resp = await client.PostAsJsonAsync(
                $"/api/spaced-repetition/{questionId}/review",
                new { selectedOption = 'A', timeTakenMs = 5000 });
            Assert.Equal(HttpStatusCode.OK, resp.StatusCode);
        }

        HttpResponseMessage final = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'A', timeTakenMs = 5000 });
        ReviewQuestionResponse? body = await final.Content.ReadFromJsonAsync<ReviewQuestionResponse>();

        Assert.NotNull(body);
        Assert.True(body.NewEaseFactor <= 3.0); // Capped at 3.0
        Assert.Equal(3.0, body.NewEaseFactor, 2);
    }

    [Fact]
    public async Task ReviewQuestion_Sm2EaseFactor_FloorAtMinimum()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        Guid questionId = _factory.Subject2QuestionIds[1];

        // Answer incorrectly several times to drive ease factor down
        for (int i = 0; i < 5; i++)
        {
            await client.PostAsJsonAsync(
                $"/api/spaced-repetition/{questionId}/review",
                new { selectedOption = 'B', timeTakenMs = 5000 });
        }

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'B', timeTakenMs = 5000 });
        ReviewQuestionResponse? body = await response.Content.ReadFromJsonAsync<ReviewQuestionResponse>();

        Assert.NotNull(body);
        Assert.True(body.NewEaseFactor >= 1.3); // Floor at 1.3
        Assert.Equal(1.3, body.NewEaseFactor, 2);
    }

    [Fact]
    public async Task ReviewQuestion_Sm2Interval_CapsAtMaximum()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        Guid questionId = _factory.Subject2QuestionIds[0];

        // Build up a large interval by answering correctly repeatedly
        for (int i = 0; i < 7; i++)
        {
            await client.PostAsJsonAsync(
                $"/api/spaced-repetition/{questionId}/review",
                new { selectedOption = 'A', timeTakenMs = 5000 });
        }

        HttpResponseMessage response = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'A', timeTakenMs = 5000 });
        ReviewQuestionResponse? body = await response.Content.ReadFromJsonAsync<ReviewQuestionResponse>();

        Assert.NotNull(body);
        Assert.True(body.NewInterval <= 365); // Capped at 365 days
    }

    [Fact]
    public async Task ReviewQuestion_Incorrect_ResetsRepetitions()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        Guid questionId = _factory.Subject2QuestionIds[2];

        // Answer correctly twice (builds up)
        HttpResponseMessage r1 = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'A', timeTakenMs = 5000 });
        ReviewQuestionResponse? body1 = await r1.Content.ReadFromJsonAsync<ReviewQuestionResponse>();
        Assert.NotNull(body1);
        Assert.Equal(1, body1.NewInterval);

        HttpResponseMessage r2 = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'A', timeTakenMs = 5000 });
        ReviewQuestionResponse? body2 = await r2.Content.ReadFromJsonAsync<ReviewQuestionResponse>();
        Assert.NotNull(body2);
        Assert.Equal(6, body2.NewInterval); // Second correct = 6 days

        // Answer incorrectly — interval should reset to 1
        HttpResponseMessage r3 = await client.PostAsJsonAsync(
            $"/api/spaced-repetition/{questionId}/review",
            new { selectedOption = 'B', timeTakenMs = 5000 });
        ReviewQuestionResponse? body3 = await r3.Content.ReadFromJsonAsync<ReviewQuestionResponse>();

        Assert.NotNull(body3);
        Assert.False(body3.IsCorrect);
        Assert.Equal(1, body3.NewInterval); // Resets to 1 day
        Assert.True(body3.NewEaseFactor < body2.NewEaseFactor);
    }
}