using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Domain.Entities;
using RevisionAI.Infrastructure.Data.Configurations;

namespace RevisionAI.Infrastructure.Data;

public class AppDbContext : DbContext, IAppDbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    public DbSet<User> Users => Set<User>();
    public DbSet<Subject> Subjects => Set<Subject>();
    public DbSet<Chapter> Chapters => Set<Chapter>();
    public DbSet<Topic> Topics => Set<Topic>();
    public DbSet<Question> Questions => Set<Question>();
    public DbSet<QuestionMedia> QuestionMedia => Set<QuestionMedia>();
    public DbSet<QuestionSchedule> QuestionSchedules => Set<QuestionSchedule>();
    public DbSet<UserAttempt> UserAttempts => Set<UserAttempt>();
    public DbSet<PendingQuestion> PendingQuestions => Set<PendingQuestion>();
    public DbSet<UserStreak> UserStreaks => Set<UserStreak>();
    public DbSet<UserXp> UserXp => Set<UserXp>();
    public DbSet<XpTransaction> XpTransactions => Set<XpTransaction>();
    public DbSet<BookmarkCollection> BookmarkCollections => Set<BookmarkCollection>();
    public DbSet<BookmarkItem> BookmarkItems => Set<BookmarkItem>();
    public DbSet<UserNote> UserNotes => Set<UserNote>();
    public DbSet<Friendship> Friendships => Set<Friendship>();
    public DbSet<MockSession> MockSessions => Set<MockSession>();
    public DbSet<MockSessionAnswer> MockSessionAnswers => Set<MockSessionAnswer>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    IQueryable<User> IAppDbContext.Users => Users;
    IQueryable<RefreshToken> IAppDbContext.RefreshTokens => RefreshTokens;
    void IAppDbContext.Add<TEntity>(TEntity entity) => Add(entity);
    public DbSet<Achievement> Achievements => Set<Achievement>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Apply all Fluent API configurations
        modelBuilder.ApplyConfiguration(new UserConfiguration());
        modelBuilder.ApplyConfiguration(new SubjectConfiguration());
        modelBuilder.ApplyConfiguration(new ChapterConfiguration());
        modelBuilder.ApplyConfiguration(new TopicConfiguration());
        modelBuilder.ApplyConfiguration(new QuestionConfiguration());
        modelBuilder.ApplyConfiguration(new QuestionMediaConfiguration());
        modelBuilder.ApplyConfiguration(new QuestionScheduleConfiguration());
        modelBuilder.ApplyConfiguration(new UserAttemptConfiguration());
        modelBuilder.ApplyConfiguration(new PendingQuestionConfiguration());
        modelBuilder.ApplyConfiguration(new UserStreakConfiguration());
        modelBuilder.ApplyConfiguration(new UserXpConfiguration());
        modelBuilder.ApplyConfiguration(new XpTransactionConfiguration());
        modelBuilder.ApplyConfiguration(new BookmarkCollectionConfiguration());
        modelBuilder.ApplyConfiguration(new BookmarkItemConfiguration());
        modelBuilder.ApplyConfiguration(new UserNoteConfiguration());
        modelBuilder.ApplyConfiguration(new FriendshipConfiguration());
        modelBuilder.ApplyConfiguration(new MockSessionConfiguration());
        modelBuilder.ApplyConfiguration(new MockSessionAnswerConfiguration());
        modelBuilder.ApplyConfiguration(new RefreshTokenConfiguration());
        modelBuilder.ApplyConfiguration(new AchievementConfiguration());

        // Seed data
        SeedData.SeedSubjects(modelBuilder);
    }
}