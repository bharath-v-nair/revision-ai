using Microsoft.EntityFrameworkCore;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Common.Interfaces;

public interface IAppDbContext
{
    DbSet<User> Users { get; }
    DbSet<Subject> Subjects { get; }
    DbSet<Chapter> Chapters { get; }
    DbSet<Question> Questions { get; }
    DbSet<QuestionMedia> QuestionMedia { get; }
    DbSet<RefreshToken> RefreshTokens { get; }
    DbSet<UserAttempt> UserAttempts { get; }
    DbSet<PendingQuestion> PendingQuestions { get; }
    void Add<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}
