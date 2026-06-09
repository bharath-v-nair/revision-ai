namespace RevisionAI.Application.Gamification;

public static class AchievementDefinitions
{
    public static readonly AchievementDefinition[] All =
    {
        new("total_xp_100", "Novice", "Earn 100 XP", "🥉", 100),
        new("total_xp_500", "Scholar", "Earn 500 XP", "📚", 500),
        new("total_xp_2000", "Master", "Earn 2000 XP", "🎓", 2000),
        new("streak_3", "Consistent", "Maintain a 3-day streak", "🔥", 3),
        new("streak_7", "Dedicated", "Maintain a 7-day streak", "💪", 7),
        new("streak_30", "Unstoppable", "Maintain a 30-day streak", "⚡", 30),
        new("questions_10", "Getting Started", "Answer 10 questions", "❓", 10),
        new("questions_50", "Curious", "Answer 50 questions", "🧠", 50),
        new("questions_100", "Knowledge Seeker", "Answer 100 questions", "🎯", 100),
        new("mocks_1", "First Test", "Complete 1 mock test", "📝", 1),
        new("mocks_5", "Test Taker", "Complete 5 mock tests", "📋", 5),
        new("mocks_10", "Exam Warrior", "Complete 10 mock tests", "🏆", 10),
    };
}

public class AchievementDefinition
{
    public string Type { get; }
    public string Name { get; }
    public string Description { get; }
    public string IconUrl { get; }
    public int ProgressMax { get; }

    public AchievementDefinition(string type, string name, string description, string iconUrl, int progressMax)
    {
        Type = type;
        Name = name;
        Description = description;
        IconUrl = iconUrl;
        ProgressMax = progressMax;
    }
}