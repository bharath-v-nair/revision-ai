namespace RevisionAI.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Email { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string? AvatarUrl { get; set; }
    public string? GoogleId { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastLoginAt { get; set; }

    // Navigation properties
    public ICollection<UserAttempt> UserAttempts { get; set; } = new List<UserAttempt>();
    public ICollection<QuestionSchedule> QuestionSchedules { get; set; } = new List<QuestionSchedule>();
    public ICollection<PendingQuestion> PendingQuestions { get; set; } = new List<PendingQuestion>();
    public UserStreak? Streak { get; set; }
    public UserXp? Xp { get; set; }
    public ICollection<XpTransaction> XpTransactions { get; set; } = new List<XpTransaction>();
    public ICollection<BookmarkCollection> BookmarkCollections { get; set; } = new List<BookmarkCollection>();
    public ICollection<UserNote> UserNotes { get; set; } = new List<UserNote>();
    public ICollection<Friendship> RequestedFriendships { get; set; } = new List<Friendship>();
    public ICollection<Friendship> ReceivedFriendships { get; set; } = new List<Friendship>();
    public ICollection<MockSession> MockSessions { get; set; } = new List<MockSession>();
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
    public ICollection<Achievement> Achievements { get; set; } = new List<Achievement>();
    public ICollection<QuestionReport> QuestionReports { get; set; } = new List<QuestionReport>();
}