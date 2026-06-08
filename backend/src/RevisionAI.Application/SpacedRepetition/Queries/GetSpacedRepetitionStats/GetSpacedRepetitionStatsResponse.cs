namespace RevisionAI.Application.SpacedRepetition.Queries.GetSpacedRepetitionStats;

public class GetSpacedRepetitionStatsResponse
{
    public int TotalScheduled { get; set; }
    public int DueToday { get; set; }
    public double AverageEaseFactor { get; set; }
    public int TotalReviews { get; set; }
}