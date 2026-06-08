namespace RevisionAI.Application.Friends.Dtos;

public class FriendRequestDto
{
    public Guid Id { get; set; }
    public Guid RequesterId { get; set; }
    public string RequesterDisplayName { get; set; } = string.Empty;
    public string RequesterEmail { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}