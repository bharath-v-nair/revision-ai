namespace RevisionAI.Application.Analysis.Queries.GetDashboard;

public class GetDashboardResponse
{
    public int TotalQuestionsAnswered { get; set; }
    public int TotalCorrect { get; set; }
    public int TotalIncorrect { get; set; }
    public double OverallAccuracy { get; set; }
    public int StreakDays { get; set; }
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public SubjectAccuracyDto? WeakestSubject { get; set; }
    public SubjectAccuracyDto? StrongestSubject { get; set; }
}

public class SubjectAccuracyDto
{
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public double Accuracy { get; set; }
}