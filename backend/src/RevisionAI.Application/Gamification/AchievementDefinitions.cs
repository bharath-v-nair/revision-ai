namespace RevisionAI.Application.Gamification;

public static class AchievementDefinitions
{
    public static readonly AchievementDefinition[] All =
    {
        // XP milestones — 7 tiers
        new("total_xp_100",   "Novice",            "Earn 100 XP",             "🥉", 100),
        new("total_xp_500",   "Scholar",            "Earn 500 XP",             "📚", 500),
        new("total_xp_2000",  "Master",             "Earn 2,000 XP",           "🎓", 2000),
        new("total_xp_5000",  "Academic",           "Earn 5,000 XP",           "⭐", 5000),
        new("total_xp_10000", "Expert",             "Earn 10,000 XP",          "💎", 10000),
        new("total_xp_25000", "Elite",              "Earn 25,000 XP",          "👑", 25000),
        new("total_xp_50000", "Legend",             "Earn 50,000 XP",          "🌟", 50000),

        // Streak milestones — 8 tiers
        new("streak_3",   "Consistent",       "Maintain a 3-day study streak",   "🔥",  3),
        new("streak_7",   "Dedicated",        "Maintain a 7-day study streak",   "💪",  7),
        new("streak_14",  "Committed",        "Maintain a 14-day study streak",  "🎯",  14),
        new("streak_30",  "Unstoppable",      "Maintain a 30-day study streak",  "⚡",  30),
        new("streak_60",  "Ironclad",         "Maintain a 60-day study streak",  "🛡️", 60),
        new("streak_100", "Centurion",        "Maintain a 100-day study streak", "🏅",  100),
        new("streak_180", "Half-Year Grind",  "Maintain a 180-day study streak", "🌙",  180),
        new("streak_365", "Year Round",       "Maintain a full-year study streak","📅", 365),

        // Questions answered — 8 tiers
        new("questions_10",   "Getting Started",  "Answer 10 questions",    "❓",  10),
        new("questions_50",   "Curious",          "Answer 50 questions",    "🧠",  50),
        new("questions_100",  "Knowledge Seeker", "Answer 100 questions",   "🎯",  100),
        new("questions_250",  "Diligent",         "Answer 250 questions",   "📖",  250),
        new("questions_500",  "Scholar's Path",   "Answer 500 questions",   "🎓",  500),
        new("questions_1000", "Question Master",  "Answer 1,000 questions", "⭐",  1000),
        new("questions_2500", "Question Warrior", "Answer 2,500 questions", "⚔️", 2500),
        new("questions_5000", "Question Legend",  "Answer 5,000 questions", "🏆",  5000),

        // Mock tests completed — 5 tiers
        new("mocks_1",  "First Test",    "Complete 1 mock test",    "📝", 1),
        new("mocks_5",  "Test Taker",    "Complete 5 mock tests",   "📋", 5),
        new("mocks_10", "Exam Warrior",  "Complete 10 mock tests",  "🏆", 10),
        new("mocks_25", "Mock Marathon", "Complete 25 mock tests",  "🏃", 25),
        new("mocks_50", "Exam Legend",   "Complete 50 mock tests",  "🌟", 50),

        // Overall accuracy — 4 tiers (needs min questions, enforced in handlers)
        // ProgressMax is the target accuracy %; progress value is current accuracy %
        new("accuracy_60", "Sharp",                "Achieve 60%+ accuracy (min 20 questions)",  "🎯", 60),
        new("accuracy_70", "Eagle Eye",            "Achieve 70%+ accuracy (min 50 questions)",  "👁️", 70),
        new("accuracy_80", "Precision",            "Achieve 80%+ accuracy (min 100 questions)", "🔬", 80),
        new("accuracy_90", "Surgeon's Precision",  "Achieve 90%+ accuracy (min 100 questions)", "⚕️", 90),

        // Bookmarks collected — 3 tiers
        new("bookmarks_1",  "First Bookmark", "Save your first bookmark",  "🔖", 1),
        new("bookmarks_10", "Avid Collector", "Save 10 bookmarks",         "📌", 10),
        new("bookmarks_50", "Bookworm",       "Save 50 bookmarks",         "📚", 50),
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
