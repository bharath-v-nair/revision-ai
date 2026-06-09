using RevisionAI.Application.Gamification.Dtos;

namespace RevisionAI.Application.Gamification.Commands.CheckAchievements;

public class CheckAchievementsResponse
{
    public List<AchievementDto> NewlyUnlocked { get; set; } = new();
}