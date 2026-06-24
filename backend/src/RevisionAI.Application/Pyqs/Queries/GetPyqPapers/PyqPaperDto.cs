namespace RevisionAI.Application.Pyqs.Queries.GetPyqPapers;

public class PyqPaperDto
{
    public string ExamName { get; set; } = string.Empty;
    public string ExamType { get; set; } = string.Empty;
    public int ExamYear { get; set; }
    public int QuestionCount { get; set; }
    public int ChapterNumber { get; set; }
}
