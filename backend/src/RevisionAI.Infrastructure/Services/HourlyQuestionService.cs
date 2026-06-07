using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Services;

public class HourlyQuestionService : BackgroundService
{
    private readonly IServiceScopeFactory _scopeFactory;
    private readonly ILogger<HourlyQuestionService> _logger;

    public HourlyQuestionService(IServiceScopeFactory scopeFactory, ILogger<HourlyQuestionService> logger)
    {
        _scopeFactory = scopeFactory;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("HourlyQuestionService started.");

        // Wait until the next top of the hour, then run every hour
        using PeriodicTimer timer = new(TimeSpan.FromHours(1));

        // First delay to align with the top of the hour
        DateTime now = DateTime.UtcNow;
        DateTime nextHour = new DateTime(now.Year, now.Month, now.Day, now.Hour, 0, 0, DateTimeKind.Utc).AddHours(1);
        TimeSpan initialDelay = nextHour - now;
        if (initialDelay.TotalMilliseconds > 0)
        {
            _logger.LogInformation("Waiting {DelayMinutes:F1} minutes until next top of the hour.", initialDelay.TotalMinutes);
            await Task.Delay(initialDelay, stoppingToken);
        }

        while (await timer.WaitForNextTickAsync(stoppingToken))
        {
            try
            {
                await DeliverHourlyQuestions(stoppingToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error delivering hourly questions.");
            }
        }
    }

    private async Task DeliverHourlyQuestions(CancellationToken cancellationToken)
    {
        using IServiceScope scope = _scopeFactory.CreateScope();
        IAppDbContext context = scope.ServiceProvider.GetRequiredService<IAppDbContext>();

        DateTime utcNow = DateTime.UtcNow;
        DateTime sevenDaysAgo = utcNow.AddDays(-7);

        // 1. Get active users (LastLoginAt within last 7 days)
        List<Guid> activeUserIds = await context.Users
            .AsNoTracking()
            .Where(u => u.LastLoginAt >= sevenDaysAgo)
            .Select(u => u.Id)
            .ToListAsync(cancellationToken);

        if (activeUserIds.Count == 0)
        {
            _logger.LogInformation("No active users found. Skipping hourly delivery.");
            return;
        }

        _logger.LogInformation("Found {Count} active users.", activeUserIds.Count);

        // 2. Pick 2 UNIFORM random questions for this hour
        int totalQuestions = await context.Questions.CountAsync(cancellationToken);
        if (totalQuestions == 0)
        {
            _logger.LogWarning("No questions in database. Skipping hourly delivery.");
            return;
        }

        Random rng = new();
        List<Guid> selectedQuestionIds = new(2);

        while (selectedQuestionIds.Count < 2)
        {
            int skip = rng.Next(totalQuestions);
            Guid questionId = await context.Questions
                .AsNoTracking()
                .OrderBy(q => q.Id)
                .Skip(skip)
                .Select(q => q.Id)
                .FirstAsync(cancellationToken);

            if (!selectedQuestionIds.Contains(questionId))
            {
                selectedQuestionIds.Add(questionId);
            }
        }

        _logger.LogInformation("Selected questions: {Q1}, {Q2}", selectedQuestionIds[0], selectedQuestionIds[1]);

        int createdCount = 0;
        int skippedCount = 0;

        // 3. For each active user, create pending questions if eligible
        foreach (Guid userId in activeUserIds)
        {
            // a. Count unanswered, unexpired pending questions
            int pendingCount = await context.PendingQuestions
                .CountAsync(pq => pq.UserId == userId
                    && !pq.IsAnswered
                    && pq.ExpiresAt > utcNow, cancellationToken);

            if (pendingCount >= 48)
            {
                skippedCount++;
                continue; // queue cap
            }

            // b. Exclude questions already attempted or already in pending queue
            List<Guid> alreadyAttempted = await context.UserAttempts
                .AsNoTracking()
                .Where(ua => ua.UserId == userId && selectedQuestionIds.Contains(ua.QuestionId))
                .Select(ua => ua.QuestionId)
                .ToListAsync(cancellationToken);

            List<Guid> alreadyPending = await context.PendingQuestions
                .AsNoTracking()
                .Where(pq => pq.UserId == userId && selectedQuestionIds.Contains(pq.QuestionId))
                .Select(pq => pq.QuestionId)
                .ToListAsync(cancellationToken);

            // c. Create PendingQuestion for eligible questions
            bool createdAny = false;
            foreach (Guid questionId in selectedQuestionIds)
            {
                if (!alreadyAttempted.Contains(questionId) && !alreadyPending.Contains(questionId))
                {
                    PendingQuestion pq = new()
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        QuestionId = questionId,
                        IsAnswered = false,
                        ExpiresAt = utcNow.AddHours(24),
                        CreatedAt = utcNow
                    };
                    context.Add(pq);
                    createdAny = true;
                }
            }

            if (createdAny)
            {
                createdCount++;
            }
        }

        await context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation(
            "Hourly delivery complete. {Created} users received questions, {Skipped} skipped (queue cap). Total active: {Total}",
            createdCount, skippedCount, activeUserIds.Count);
    }
}