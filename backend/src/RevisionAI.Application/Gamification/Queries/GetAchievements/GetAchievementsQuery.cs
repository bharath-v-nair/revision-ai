using MediatR;
using RevisionAI.Application.Gamification.Dtos;

namespace RevisionAI.Application.Gamification.Queries.GetAchievements;

public class GetAchievementsQuery : IRequest<List<AchievementDto>>
{
    public Guid UserId { get; set; }
}