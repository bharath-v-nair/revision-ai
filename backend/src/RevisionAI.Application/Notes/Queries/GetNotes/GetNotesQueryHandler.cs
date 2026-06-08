using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Notes.Queries.GetNotes;

public class GetNotesQueryHandler : IRequestHandler<GetNotesQuery, List<GetNotesResponse>>
{
    private readonly IAppDbContext _context;

    public GetNotesQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<List<GetNotesResponse>> Handle(GetNotesQuery request, CancellationToken cancellationToken)
    {
        IQueryable<Domain.Entities.UserNote> query = _context.UserNotes
            .AsNoTracking()
            .Where(n => n.UserId == request.UserId);

        if (request.QuestionId.HasValue)
        {
            query = query.Where(n => n.QuestionId == request.QuestionId.Value);
        }

        if (request.TopicId.HasValue)
        {
            query = query.Where(n => n.TopicId == request.TopicId.Value);
        }

        List<GetNotesResponse> notes = await query
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new GetNotesResponse
            {
                Id = n.Id,
                QuestionId = n.QuestionId,
                TopicId = n.TopicId,
                BlobUrl = n.BlobUrl,
                NoteType = n.NoteType,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return notes;
    }
}