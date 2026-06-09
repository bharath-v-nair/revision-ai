using MediatR;
using RevisionAI.Application.Gamification.Dtos;

namespace RevisionAI.Application.Gamification.Commands.CheckAchievements;

public class CheckAchievementsCommand : IRequest<CheckAchievementsResponse>
{
    public Guid UserId { get; set; }
}