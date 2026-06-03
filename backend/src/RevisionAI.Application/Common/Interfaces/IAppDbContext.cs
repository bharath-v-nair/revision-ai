using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Common.Interfaces;

public interface IAppDbContext
{
    IQueryable<User> Users { get; }
    IQueryable<RefreshToken> RefreshTokens { get; }
    void Add<TEntity>(TEntity entity) where TEntity : class;
    Task<int> SaveChangesAsync(CancellationToken cancellationToken = default);
}