namespace RevisionAI.Domain.Entities;

public class Question
{
    public Guid Id { get; set; }
    public Guid SubjectId { get; set; }
    public Guid ChapterId { get; set; }
    public Guid? TopicId { get; set; }
    public int QuestionNumber { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string OptionA { get; set; } = string.Empty;
    public string OptionB { get; set; } = string.Empty;
    public string OptionC { get; set; } = string.Empty;
    public string OptionD { get; set; } = string.Empty;
    public char CorrectOption { get; set; }
    public string Explanation { get; set; } = string.Empty;
    public int? Difficulty { get; set; }
    public int SourcePage { get; set; }
    public bool HasMedia { get; set; }
    public bool IsPYQ { get; set; }
    public string? ExamName { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation properties
    public Subject Subject { get; set; } = null!;
    public Chapter Chapter { get; set; } = null!;
    public Topic? Topic { get; set; }
    public ICollection<QuestionMedia> Media { get; set; } = new List<QuestionMedia>();
    public ICollection<QuestionSchedule> Schedules { get; set; } = new List<QuestionSchedule>();
    public ICollection<UserAttempt> UserAttempts { get; set; } = new List<UserAttempt>();
    public ICollection<PendingQuestion> PendingQuestions { get; set; } = new List<PendingQuestion>();
    public ICollection<BookmarkItem> BookmarkItems { get; set; } = new List<BookmarkItem>();
    public ICollection<UserNote> UserNotes { get; set; } = new List<UserNote>();
    public ICollection<MockSessionAnswer> MockSessionAnswers { get; set; } = new List<MockSessionAnswer>();
    public ICollection<XpTransaction> XpTransactions { get; set; } = new List<XpTransaction>();
    public ICollection<QuestionReport> QuestionReports { get; set; } = new List<QuestionReport>();
}