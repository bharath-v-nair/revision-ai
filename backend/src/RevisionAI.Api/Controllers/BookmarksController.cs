using System.Security.Claims;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using RevisionAI.Application.Bookmarks.Commands.AddBookmarkItem;
using RevisionAI.Application.Bookmarks.Commands.CreateCollection;
using RevisionAI.Application.Bookmarks.Commands.DeleteCollection;
using RevisionAI.Application.Bookmarks.Commands.RemoveBookmarkItem;
using RevisionAI.Application.Bookmarks.Commands.RenameCollection;
using RevisionAI.Application.Bookmarks.Queries.GetCollectionItems;
using RevisionAI.Application.Bookmarks.Queries.GetCollections;

namespace RevisionAI.Api.Controllers;

[ApiController]
[Route("api/bookmarks")]
[Authorize]
public class BookmarksController : ControllerBase
{
    private readonly IMediator _mediator;

    public BookmarksController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Create a new bookmark collection.
    /// </summary>
    [HttpPost("collections")]
    public async Task<ActionResult<CreateCollectionResponse>> CreateCollection(
        [FromBody] CreateCollectionRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        CreateCollectionCommand command = new()
        {
            UserId = userId,
            Name = request.Name,
            Icon = request.Icon
        };

        CreateCollectionResponse result = await _mediator.Send(command, cancellationToken);

        return Created(string.Empty, result);
    }

    /// <summary>
    /// List all bookmark collections for the current user.
    /// </summary>
    [HttpGet("collections")]
    public async Task<ActionResult<List<GetCollectionsResponse>>> GetCollections(
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        GetCollectionsQuery query = new()
        {
            UserId = userId
        };

        List<GetCollectionsResponse> result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    /// <summary>
    /// Rename a bookmark collection.
    /// </summary>
    [HttpPatch("collections/{id:guid}")]
    public async Task<IActionResult> RenameCollection(
        Guid id,
        [FromBody] RenameCollectionRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        RenameCollectionCommand command = new()
        {
            UserId = userId,
            CollectionId = id,
            Name = request.Name,
        };

        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Delete a bookmark collection and all its items.
    /// </summary>
    [HttpDelete("collections/{id:guid}")]
    public async Task<IActionResult> DeleteCollection(
        Guid id,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        DeleteCollectionCommand command = new()
        {
            UserId = userId,
            CollectionId = id,
        };

        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Add a question to a bookmark collection.
    /// </summary>
    [HttpPost("collections/{id:guid}/items")]
    public async Task<ActionResult<AddBookmarkItemResponse>> AddBookmarkItem(
        Guid id,
        [FromBody] AddBookmarkItemRequest request,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        AddBookmarkItemCommand command = new()
        {
            UserId = userId,
            CollectionId = id,
            QuestionId = request.QuestionId
        };

        AddBookmarkItemResponse result = await _mediator.Send(command, cancellationToken);

        return Created(string.Empty, result);
    }

    /// <summary>
    /// Remove a question from a bookmark collection.
    /// </summary>
    [HttpDelete("collections/{id:guid}/items/{questionId:guid}")]
    public async Task<IActionResult> RemoveBookmarkItem(
        Guid id,
        Guid questionId,
        CancellationToken cancellationToken)
    {
        Guid userId = GetUserId();

        RemoveBookmarkItemCommand command = new()
        {
            UserId = userId,
            CollectionId = id,
            QuestionId = questionId
        };

        await _mediator.Send(command, cancellationToken);

        return NoContent();
    }

    /// <summary>
    /// Get paginated questions in a bookmark collection.
    /// </summary>
    [HttpGet("collections/{id:guid}/items")]
    public async Task<ActionResult<GetCollectionItemsResponse>> GetCollectionItems(
        Guid id,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20,
        CancellationToken cancellationToken = default)
    {
        Guid userId = GetUserId();

        GetCollectionItemsQuery query = new()
        {
            UserId = userId,
            CollectionId = id,
            Page = page,
            PageSize = pageSize
        };

        GetCollectionItemsResponse result = await _mediator.Send(query, cancellationToken);

        return Ok(result);
    }

    private Guid GetUserId()
    {
        string? userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return Guid.Parse(userIdClaim!);
    }
}

public class CreateCollectionRequest
{
    public string Name { get; set; } = string.Empty;
    public string? Icon { get; set; }
}

public class AddBookmarkItemRequest
{
    public Guid QuestionId { get; set; }
}

public class RenameCollectionRequest
{
    public string Name { get; set; } = string.Empty;
}