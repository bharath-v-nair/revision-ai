namespace RevisionAI.Application.HourlyQuestions.Commands.AnswerQuestion;

public class AnswerQuestionResponse
{
    public bool IsCorrect { get; set; }
    public char CorrectOption { get; set; }
    public string Explanation { get; set; } = string.Empty;
}