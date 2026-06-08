namespace RevisionAI.Application.Leaderboards.Dtos;

public class UserSearchResultDto
{
    public Guid UserId { get; set; }
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
}