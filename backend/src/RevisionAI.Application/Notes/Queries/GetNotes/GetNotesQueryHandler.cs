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
            Guid? chapterId = await _context.Questions
                .Where(q => q.Id == request.QuestionId.Value)
                .Select(q => (Guid?)q.ChapterId)
                .FirstOrDefaultAsync(cancellationToken);

            query = query.Where(n =>
                n.QuestionId == request.QuestionId.Value ||
                (n.ChapterId != null && n.ChapterId == chapterId)
            );
        }
        else
        {
            if (request.ChapterId.HasValue)
            {
                query = query.Where(n => n.ChapterId == request.ChapterId.Value);
            }

            if (request.SubjectId.HasValue)
            {
                query = query.Where(n =>
                    n.Chapter!.SubjectId == request.SubjectId.Value ||
                    n.Question!.Chapter!.SubjectId == request.SubjectId.Value
                );
            }

            if (request.TopicId.HasValue)
            {
                query = query.Where(n => n.TopicId == request.TopicId.Value);
            }
        }

        List<GetNotesResponse> notes = await query
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new GetNotesResponse
            {
                Id = n.Id,
                QuestionId = n.QuestionId,
                ChapterId = n.ChapterId ?? n.Question!.ChapterId,
                TopicId = n.TopicId,
                ChapterTitle = n.Chapter != null
                    ? n.Chapter.Title
                    : n.Question != null ? n.Question.Chapter!.Title : string.Empty,
                ChapterNumber = n.Chapter != null
                    ? n.Chapter.ChapterNumber
                    : n.Question != null ? n.Question.Chapter!.ChapterNumber : 0,
                SubjectId = n.Chapter != null
                    ? n.Chapter.SubjectId
                    : n.Question != null ? (Guid?)n.Question.Chapter!.SubjectId : null,
                SubjectName = n.Chapter != null
                    ? n.Chapter.Subject.Name
                    : n.Question != null ? n.Question.Chapter!.Subject.Name : string.Empty,
                BlobUrl = n.BlobUrl,
                NoteType = n.NoteType,
                CreatedAt = n.CreatedAt
            })
            .ToListAsync(cancellationToken);

        return notes;
    }
}
