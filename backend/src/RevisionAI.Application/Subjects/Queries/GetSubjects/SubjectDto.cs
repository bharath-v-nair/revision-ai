namespace RevisionAI.Application.Subjects.Queries.GetSubjects;

public class SubjectDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconName { get; set; }
    public int QuestionCount { get; set; }
}