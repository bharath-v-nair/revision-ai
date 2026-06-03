namespace RevisionAI.Domain.Entities;

public class Subject
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Slug { get; set; } = string.Empty;
    public string? IconName { get; set; }

    // Navigation properties
    public ICollection<Chapter> Chapters { get; set; } = new List<Chapter>();
    public ICollection<Question> Questions { get; set; } = new List<Question>();
}