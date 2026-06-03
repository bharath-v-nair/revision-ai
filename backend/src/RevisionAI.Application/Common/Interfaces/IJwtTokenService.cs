using RevisionAI.Domain.Entities;

namespace RevisionAI.Application.Common.Interfaces;

public interface IJwtTokenService
{
    string GenerateAccessToken(User user);
}