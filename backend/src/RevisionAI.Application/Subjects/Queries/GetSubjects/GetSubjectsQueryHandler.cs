using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Subjects.Queries.GetSubjects;

public class GetSubjectsQueryHandler : IRequestHandler<GetSubjectsQuery, GetSubjectsResponse>
{
    private readonly IAppDbContext _context;

    public GetSubjectsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetSubjectsResponse> Handle(GetSubjectsQuery request, CancellationToken cancellationToken)
    {
        List<SubjectDto> subjects = await _context.Subjects
            .AsNoTracking()
            .OrderBy(s => s.Name)
            .Select(s => new SubjectDto
            {
                Id = s.Id,
                Name = s.Name,
                Slug = s.Slug,
                IconName = s.IconName,
                QuestionCount = s.Questions.Count
            })
            .ToListAsync(cancellationToken);

        return new GetSubjectsResponse { Data = subjects };
    }
}