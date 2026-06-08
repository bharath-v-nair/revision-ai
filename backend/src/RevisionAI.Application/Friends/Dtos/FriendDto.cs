namespace RevisionAI.Application.Friends.Dtos;

public class FriendDto
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public int TotalXp { get; set; }
    public int CurrentLevel { get; set; }
    public DateTime FriendsSince { get; set; }
}