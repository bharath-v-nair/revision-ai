using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.DependencyInjection.Extensions;
using Microsoft.Extensions.Hosting;
using Microsoft.IdentityModel.Tokens;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;
using RevisionAI.Infrastructure.Data;

namespace RevisionAI.Api.IntegrationTests;

public class CustomWebApplicationFactory : WebApplicationFactory<Program>, IAsyncLifetime
{
    private readonly string _databaseName = Guid.NewGuid().ToString();
    public Guid TestUserId { get; } = Guid.NewGuid();
    public string TestUserEmail { get; } = "test@integration.tests";
    public Guid Subject1Id { get; } = Guid.NewGuid();
    public Guid Subject2Id { get; } = Guid.NewGuid();

    public List<Guid> Subject1QuestionIds { get; } = new();
    public List<Guid> Subject2QuestionIds { get; } = new();

    protected override void ConfigureWebHost(IWebHostBuilder builder)
    {
        builder.ConfigureServices(services =>
        {
            // Remove ALL DbContext registrations (Npgsql provider from Program.cs)
            RemoveDbContextRegistrations(services);

            // Remove background services that interfere with tests
            RemoveServiceByFullName(services, "HourlyQuestionService");
        });
    }

    private static void RemoveDbContextRegistrations(IServiceCollection services)
    {
        // Collect all descriptors related to AppDbContext
        ServiceDescriptor[] toRemove = services
            .Where(d => ReferencesAppDbContext(d))
            .ToArray();

        foreach (ServiceDescriptor descriptor in toRemove)
        {
            services.Remove(descriptor);
        }

        // Register InMemory replacements
        services.AddDbContext<AppDbContext>(options =>
            options.UseInMemoryDatabase("test-" + Guid.NewGuid().ToString("N")));

        services.AddScoped<IAppDbContext>(sp =>
            sp.GetRequiredService<AppDbContext>());
    }

    private static bool ReferencesAppDbContext(ServiceDescriptor d)
    {
        // Direct types
        if (d.ServiceType == typeof(DbContextOptions<AppDbContext>)) return true;
        if (d.ServiceType == typeof(DbContextOptions)) return true;
        if (d.ServiceType == typeof(AppDbContext)) return true;
        if (d.ImplementationType == typeof(AppDbContext)) return true;
        if (d.ServiceType == typeof(IAppDbContext)) return true;
        if (d.ImplementationType == typeof(IAppDbContext)) return true;

        // Any EF Core service with AppDbContext in the generic arguments or name
        string? serviceName = d.ServiceType.FullName ?? "";
        string? implName = d.ImplementationType?.FullName ?? "";

        // Remove IDbContextOptionsConfiguration<AppDbContext> and similar
        if (serviceName.Contains("AppDbContext") || implName.Contains("AppDbContext"))
            return true;

        // Remove Npgsql-specific providers
        if (serviceName.Contains("Npgsql") || implName.Contains("Npgsql"))
            return true;

        // Remove Npgsql IDbContextOptionsExtension
        if (d.ServiceType.Name.Contains("DbContextOptionsExtension") ||
            d.ImplementationInstance?.GetType().FullName?.Contains("Npgsql") == true)
            return true;

        return false;
    }

    private static void RemoveServiceByFullName(IServiceCollection services, string fullNameContains)
    {
        ServiceDescriptor? descriptor = services
            .FirstOrDefault(d => (d.ImplementationType?.FullName?.Contains(fullNameContains) ?? false));
        if (descriptor is not null)
            services.Remove(descriptor);
    }

    public async Task InitializeAsync()
    {
        using IServiceScope scope = Services.CreateScope();
        AppDbContext dbContext = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        CancellationToken ct = CancellationToken.None;

        dbContext.Users.Add(new User
        {
            Id = TestUserId,
            Email = TestUserEmail,
            DisplayName = "Test User",
            LastLoginAt = DateTime.UtcNow,
            CreatedAt = DateTime.UtcNow
        });

        Subject subject1 = new()
        {
            Id = Subject1Id,
            Name = "Test Subject 1",
            Slug = "test-subject-1",
            IconName = "test"
        };
        dbContext.Subjects.Add(subject1);

        Subject subject2 = new()
        {
            Id = Subject2Id,
            Name = "Test Subject 2",
            Slug = "test-subject-2",
            IconName = "test"
        };
        dbContext.Subjects.Add(subject2);

        Chapter chapter1 = new()
        {
            Id = Guid.NewGuid(),
            SubjectId = Subject1Id,
            Title = "Test Chapter 1",
            ChapterNumber = 1,
            StartPage = 1,
            EndPage = 10
        };
        dbContext.Chapters.Add(chapter1);

        Chapter chapter2 = new()
        {
            Id = Guid.NewGuid(),
            SubjectId = Subject2Id,
            Title = "Test Chapter 2",
            ChapterNumber = 1,
            StartPage = 1,
            EndPage = 10
        };
        dbContext.Chapters.Add(chapter2);

        char[] correctOptions = ['A', 'B', 'C', 'D', 'A'];
        for (int i = 0; i < 5; i++)
        {
            Guid qId = Guid.NewGuid();
            Subject1QuestionIds.Add(qId);
            dbContext.Questions.Add(new Question
            {
                Id = qId,
                SubjectId = Subject1Id,
                ChapterId = chapter1.Id,
                QuestionNumber = i + 1,
                QuestionText = $"Subject 1 Question {i + 1}: What is the answer?",
                OptionA = "Option A - correct for Q1, Q5",
                OptionB = "Option B - correct for Q2",
                OptionC = "Option C - correct for Q3",
                OptionD = "Option D - correct for Q4",
                CorrectOption = correctOptions[i],
                Explanation = $"Explanation for S1 Q{i + 1}",
                SourcePage = 1,
                HasMedia = false,
                IsPYQ = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        for (int i = 0; i < 5; i++)
        {
            Guid qId = Guid.NewGuid();
            Subject2QuestionIds.Add(qId);
            dbContext.Questions.Add(new Question
            {
                Id = qId,
                SubjectId = Subject2Id,
                ChapterId = chapter2.Id,
                QuestionNumber = i + 1,
                QuestionText = $"Subject 2 Question {i + 1}: Pick option A",
                OptionA = "Correct answer A",
                OptionB = "Wrong answer B",
                OptionC = "Wrong answer C",
                OptionD = "Wrong answer D",
                CorrectOption = 'A',
                Explanation = $"Explanation for S2 Q{i + 1}",
                SourcePage = 1,
                HasMedia = false,
                IsPYQ = false,
                CreatedAt = DateTime.UtcNow
            });
        }

        await dbContext.SaveChangesAsync(ct);
    }

    public new Task DisposeAsync() => Task.CompletedTask;

    public HttpClient CreateAuthenticatedClient()
    {
        HttpClient client = CreateClient();
        string token = GenerateTestJwt();
        client.DefaultRequestHeaders.Authorization =
            new System.Net.Http.Headers.AuthenticationHeaderValue(
                JwtBearerDefaults.AuthenticationScheme, token);
        return client;
    }

    public HttpClient CreateUnauthenticatedClient() => CreateClient();

    private string GenerateTestJwt()
    {
        string key = "dev-key-at-least-32-chars-long!!";
        SymmetricSecurityKey securityKey = new(Encoding.UTF8.GetBytes(key));
        SigningCredentials credentials = new(securityKey, SecurityAlgorithms.HmacSha256);

        Claim[] claims =
        [
            new Claim(JwtRegisteredClaimNames.Sub, TestUserId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, TestUserEmail),
            new Claim("displayName", "Test User"),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        ];

        JwtSecurityToken token = new(
            issuer: "RevisionAI",
            audience: "RevisionAI",
            claims: claims,
            expires: DateTime.UtcNow.AddMinutes(15),
            signingCredentials: credentials
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}