namespace RevisionAI.Application.Analysis.Commands.AnalyzeBatch;

public class AnalyzeBatchResponse
{
    public int TotalQuestions { get; set; }
    public int CorrectCount { get; set; }
    public int IncorrectCount { get; set; }
    public double AccuracyPercentage { get; set; }
    public double AverageTimeMs { get; set; }
}