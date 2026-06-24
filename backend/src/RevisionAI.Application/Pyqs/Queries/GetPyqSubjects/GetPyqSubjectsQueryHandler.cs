using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Application.Pyqs.Queries.GetPyqSubjects;

public class GetPyqSubjectsQueryHandler : IRequestHandler<GetPyqSubjectsQuery, GetPyqSubjectsResponse>
{
    private readonly IAppDbContext _context;

    public GetPyqSubjectsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetPyqSubjectsResponse> Handle(GetPyqSubjectsQuery request, CancellationToken cancellationToken)
    {
        // One row per subject that owns at least one PYQ question.
        // A "paper" is a distinct ExamName (e.g. "AIIMS 2017") within the subject.
        List<PyqSubjectDto> subjects = await _context.Subjects
            .AsNoTracking()
            .Where(s => s.Questions.Any(q => q.IsPYQ))
            .OrderBy(s => s.Name)
            .Select(s => new PyqSubjectDto
            {
                SubjectId = s.Id,
                SubjectName = s.Name,
                SubjectSlug = s.Slug,
                TotalQuestions = s.Questions.Count(q => q.IsPYQ),
                TotalPapers = s.Questions
                    .Where(q => q.IsPYQ)
                    .Select(q => q.ExamName)
                    .Distinct()
                    .Count()
            })
            .ToListAsync(cancellationToken);

        return new GetPyqSubjectsResponse { Data = subjects };
    }
}
