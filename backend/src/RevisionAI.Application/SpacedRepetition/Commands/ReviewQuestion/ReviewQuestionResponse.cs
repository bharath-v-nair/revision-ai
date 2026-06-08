namespace RevisionAI.Application.SpacedRepetition.Commands.ReviewQuestion;

public class ReviewQuestionResponse
{
    public bool IsCorrect { get; set; }
    public char CorrectOption { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public double NewEaseFactor { get; set; }
    public int NewInterval { get; set; }
    public DateTime NextReviewDate { get; set; }
}