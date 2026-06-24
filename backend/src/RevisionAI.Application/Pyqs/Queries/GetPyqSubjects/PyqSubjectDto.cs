namespace RevisionAI.Application.Pyqs.Queries.GetPyqSubjects;

public class PyqSubjectDto
{
    public Guid SubjectId { get; set; }
    public string SubjectName { get; set; } = string.Empty;
    public string SubjectSlug { get; set; } = string.Empty;
    public int TotalPapers { get; set; }
    public int TotalQuestions { get; set; }
}
