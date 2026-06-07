namespace RevisionAI.Application.Subjects.Queries.GetSubjectChapters;

public class ChapterDto
{
    public Guid Id { get; set; }
    public int ChapterNumber { get; set; }
    public string Title { get; set; } = string.Empty;
    public int StartPage { get; set; }
    public int EndPage { get; set; }
    public int QuestionCount { get; set; }
}