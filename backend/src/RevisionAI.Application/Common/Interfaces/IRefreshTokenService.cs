using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Common.Interfaces;

public interface IRefreshTokenService
{
    RefreshToken GenerateRefreshToken(User user);
}