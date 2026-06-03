namespace RevisionAI.Domain.Entities;

public class Friendship
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public Guid AddresseeId { get; set; }
    public string Status { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
    public DateTime? AcceptedAt { get; set; }

    // Navigation
    public User Requester { get; set; } = null!;
    public User Addressee { get; set; } = null!;
}