namespace RevisionAI.Application.Analysis.Queries.GetQuestionHistory;

public class GetQuestionHistoryResponse
{
    public string QuestionText { get; set; } = string.Empty;
    public double CurrentEaseFactor { get; set; }
    public int CurrentInterval { get; set; }
    public List<AttemptDto> Attempts { get; set; } = new();
}

public class AttemptDto
{
    public string SessionType { get; set; } = string.Empty;
    public char SelectedOption { get; set; }
    public bool IsCorrect { get; set; }
    public int TimeTakenMs { get; set; }
    public DateTime CreatedAt { get; set; }
}