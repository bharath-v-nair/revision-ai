using System.Net;
using System.Net.Http.Json;
using System.Text.Json;
using RevisionAI.Application.Mocks.Commands.CompleteMock;
using RevisionAI.Application.Mocks.Commands.GenerateMock;
using RevisionAI.Application.Mocks.Commands.SubmitMockAnswers;
using RevisionAI.Application.Mocks.Queries.GetMockHistory;
using RevisionAI.Application.Mocks.Queries.GetMockResults;

namespace RevisionAI.Api.IntegrationTests.MockEngine;

/// <summary>
/// Integration tests for Mock Engine (Phase 2.3).
/// Uses Subject 2 only — all correct answers are 'A' for deterministic assertions.
/// Tests avoid InMemory EF navigation property projections (known limitation).
/// For full coverage with real DB, upgrade to Testcontainers.PostgreSql.
/// </summary>
public class MockEngineTests : IClassFixture<CustomWebApplicationFactory>
{
    private readonly CustomWebApplicationFactory _factory;

    public MockEngineTests(CustomWebApplicationFactory factory)
    {
        _factory = factory;
    }

    [Fact]
    public async Task GenerateMock_ReturnsSessionWithQuestions()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        var request = new { subjectIds = new[] { _factory.Subject2Id }, questionCount = 3, timeLimitMinutes = 30 };

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/mocks/generate", request);
        GenerateMockResponse? body = await response.Content.ReadFromJsonAsync<GenerateMockResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.NotNull(body);
        Assert.NotEqual(Guid.Empty, body.MockSessionId);
        Assert.Equal(3, body.TotalQuestions);
        Assert.Equal(3, body.Questions.Count);
        Assert.Equal(30, body.TimeLimitMinutes);
        Assert.NotEmpty(body.Questions[0].QuestionText);
    }

    [Fact]
    public async Task GenerateMock_HidesCorrectOptionAndExplanation()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        var request = new { subjectIds = new[] { _factory.Subject2Id }, questionCount = 3, timeLimitMinutes = 10 };

        HttpResponseMessage response = await client.PostAsJsonAsync("/api/mocks/generate", request);
        string rawJson = await response.Content.ReadAsStringAsync();
        JsonDocument json = JsonDocument.Parse(rawJson);

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.False(json.RootElement.GetProperty("questions")[0].TryGetProperty("correctOption", out _));
        Assert.False(json.RootElement.GetProperty("questions")[0].TryGetProperty("explanation", out _));
    }

    [Fact]
    public async Task GetMockSession_Returns200_WhenOwner()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);

        HttpResponseMessage response = await client.GetAsync($"/api/mocks/{mock.MockSessionId}");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetMockSession_Returns404_WhenNotOwner()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        await GenerateMock(client, 3);

        HttpResponseMessage response = await client.GetAsync($"/api/mocks/{Guid.NewGuid()}");
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task SubmitAnswers_ReturnsCorrectnessAndExplanation()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);

        // Subject 2 — all correct answers are 'A'
        // Q1=A ✓, Q2=B ✗, Q3=A ✓
        var request = new
        {
            answers = new[]
            {
                new { questionId = mock.Questions[0].QuestionId, displayOrder = 1, selectedOption = 'A', timeTakenMs = 30000 },
                new { questionId = mock.Questions[1].QuestionId, displayOrder = 2, selectedOption = 'B', timeTakenMs = 45000 },
                new { questionId = mock.Questions[2].QuestionId, displayOrder = 3, selectedOption = 'A', timeTakenMs = 25000 }
            }
        };

        HttpResponseMessage response = await client.PostAsJsonAsync($"/api/mocks/{mock.MockSessionId}/answers", request);
        SubmitMockAnswersResponse? body = await response.Content.ReadFromJsonAsync<SubmitMockAnswersResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(3, body!.Results.Count);
        Assert.True(body.Results[0].IsCorrect);
        Assert.False(body.Results[1].IsCorrect);
        Assert.True(body.Results[2].IsCorrect);
        Assert.NotEqual('\0', body.Results[0].CorrectOption);
        Assert.NotEmpty(body.Results[0].Explanation);
    }

    [Fact]
    public async Task SubmitAnswers_Returns400_WhenQuestionNotInSession()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);

        HttpResponseMessage response = await client.PostAsJsonAsync($"/api/mocks/{mock.MockSessionId}/answers",
            new { answers = new[] { new { questionId = Guid.NewGuid(), displayOrder = 999, selectedOption = 'A', timeTakenMs = 10000 } } });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task CompleteMock_ComputesFinalScore()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);
        await AnswerAllCorrectly(client, mock);

        HttpResponseMessage response = await client.PostAsync($"/api/mocks/{mock.MockSessionId}/complete", null);
        CompleteMockResponse? body = await response.Content.ReadFromJsonAsync<CompleteMockResponse>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Equal(3, body!.TotalQuestions);
        Assert.Equal(3, body.AnsweredCount);
        Assert.Equal(3, body.CorrectCount);
        Assert.Equal(0, body.SkippedCount);
        Assert.Equal(3, body.Score);
    }

    [Fact]
    public async Task CompleteMock_Returns400_WhenAlreadyCompleted()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);
        await AnswerAllCorrectly(client, mock);
        await client.PostAsync($"/api/mocks/{mock.MockSessionId}/complete", null);

        HttpResponseMessage response = await client.PostAsync($"/api/mocks/{mock.MockSessionId}/complete", null);
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetResults_Returns200_WhenCompleted()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);
        await AnswerAllCorrectly(client, mock);
        await client.PostAsync($"/api/mocks/{mock.MockSessionId}/complete", null);

        HttpResponseMessage response = await client.GetAsync($"/api/mocks/{mock.MockSessionId}/results");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task GetResults_Returns400_WhenNotCompleted()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);

        HttpResponseMessage response = await client.GetAsync($"/api/mocks/{mock.MockSessionId}/results");
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetHistory_Returns200_WithPagination()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        for (int i = 0; i < 2; i++)
        {
            GenerateMockResponse mock = await GenerateMock(client, 3);
            await AnswerAllCorrectly(client, mock);
            await client.PostAsync($"/api/mocks/{mock.MockSessionId}/complete", null);
        }

        HttpResponseMessage response = await client.GetAsync("/api/mocks/history?page=1&pageSize=20");
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
    }

    [Fact]
    public async Task RetakeIncorrect_CreatesNewMock_WithOnlyWrongAnswers()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);

        // Q1=A (correct), Q2=B (wrong, correct is A), Q3=A (correct)
        var request = new
        {
            answers = new[]
            {
                new { questionId = mock.Questions[0].QuestionId, displayOrder = 1, selectedOption = 'A', timeTakenMs = 30000 },
                new { questionId = mock.Questions[1].QuestionId, displayOrder = 2, selectedOption = 'B', timeTakenMs = 45000 },
                new { questionId = mock.Questions[2].QuestionId, displayOrder = 3, selectedOption = 'A', timeTakenMs = 25000 }
            }
        };
        await client.PostAsJsonAsync($"/api/mocks/{mock.MockSessionId}/answers", request);

        HttpResponseMessage retakeResponse = await client.PostAsJsonAsync(
            "/api/mocks/generate/retake-incorrect",
            new { previousMockSessionId = mock.MockSessionId });
        GenerateMockResponse? retakeBody = await retakeResponse.Content.ReadFromJsonAsync<GenerateMockResponse>();

        Assert.Equal(HttpStatusCode.OK, retakeResponse.StatusCode);
        Assert.Equal(1, retakeBody!.TotalQuestions); // Only Q2 was wrong
    }

    [Fact]
    public async Task RetakeIncorrect_Returns400_WhenAllCorrect()
    {
        HttpClient client = _factory.CreateAuthenticatedClient();
        GenerateMockResponse mock = await GenerateMock(client, 3);
        await AnswerAllCorrectly(client, mock);

        HttpResponseMessage response = await client.PostAsJsonAsync(
            "/api/mocks/generate/retake-incorrect",
            new { previousMockSessionId = mock.MockSessionId });

        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task AllEndpoints_RequireAuthentication()
    {
        HttpClient client = _factory.CreateUnauthenticatedClient();
        var generateRequest = new { subjectIds = new[] { _factory.Subject2Id }, questionCount = 3 };

        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/mocks/generate", generateRequest)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync($"/api/mocks/{Guid.NewGuid()}")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync($"/api/mocks/{Guid.NewGuid()}/answers",
                new { answers = Array.Empty<object>() })).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsync($"/api/mocks/{Guid.NewGuid()}/complete", null)).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync($"/api/mocks/{Guid.NewGuid()}/results")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.GetAsync("/api/mocks/history")).StatusCode);
        Assert.Equal(HttpStatusCode.Unauthorized,
            (await client.PostAsJsonAsync("/api/mocks/generate/retake-incorrect",
                new { previousMockSessionId = Guid.NewGuid() })).StatusCode);
    }

    // ──────────────── Test Helpers ────────────────

    private async Task<GenerateMockResponse> GenerateMock(HttpClient client, int questionCount)
    {
        var request = new { subjectIds = new[] { _factory.Subject2Id }, questionCount, timeLimitMinutes = 20 };
        HttpResponseMessage response = await client.PostAsJsonAsync("/api/mocks/generate", request);
        var body = await response.Content.ReadFromJsonAsync<GenerateMockResponse>();
        return body!;
    }

    private static async Task AnswerAllCorrectly(HttpClient client, GenerateMockResponse mock)
    {
        var request = new
        {
            answers = mock.Questions.Select(q => new
            {
                questionId = q.QuestionId,
                displayOrder = q.DisplayOrder,
                selectedOption = 'A',
                timeTakenMs = 30000
            }).ToArray()
        };
        await client.PostAsJsonAsync($"/api/mocks/{mock.MockSessionId}/answers", request);
    }
}