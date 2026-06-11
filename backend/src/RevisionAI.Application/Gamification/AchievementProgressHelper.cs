namespace RevisionAI.Application.Gamification;

internal static class AchievementProgressHelper
{
    // Minimum questions required before accuracy achievements count
    private const int AccuracyMinQuestions60 = 20;
    private const int AccuracyMinQuestions70 = 50;
    private const int AccuracyMinQuestions80 = 100;
    private const int AccuracyMinQuestions90 = 100;

    internal static int CalcAccuracy(int totalQuestions, int correctAnswers)
        => totalQuestions > 0 ? correctAnswers * 100 / totalQuestions : 0;

    internal static int GetProgress(
        string type,
        int totalXp,
        int currentStreak,
        int totalQuestionsAnswered,
        int totalMocksCompleted,
        int accuracyPercent,
        int totalBookmarks)
        => type switch
        {
            string t when t.StartsWith("total_xp_",   StringComparison.Ordinal) => totalXp,
            string t when t.StartsWith("streak_",     StringComparison.Ordinal) => currentStreak,
            string t when t.StartsWith("questions_",  StringComparison.Ordinal) => totalQuestionsAnswered,
            string t when t.StartsWith("mocks_",      StringComparison.Ordinal) => totalMocksCompleted,
            string t when t.StartsWith("bookmarks_",  StringComparison.Ordinal) => totalBookmarks,
            "accuracy_60" => totalQuestionsAnswered >= AccuracyMinQuestions60 ? accuracyPercent : 0,
            "accuracy_70" => totalQuestionsAnswered >= AccuracyMinQuestions70 ? accuracyPercent : 0,
            "accuracy_80" => totalQuestionsAnswered >= AccuracyMinQuestions80 ? accuracyPercent : 0,
            "accuracy_90" => totalQuestionsAnswered >= AccuracyMinQuestions90 ? accuracyPercent : 0,
            _ => 0,
        };
}
