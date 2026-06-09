using MediatR;
using RevisionAI.Application.Gamification.Dtos;

namespace RevisionAI.Application.Gamification.Queries.GetAchievementDetail;

public class GetAchievementDetailQuery : IRequest<AchievementDto?>
{
    public Guid UserId { get; set; }
    public Guid AchievementId { get; set; }
}