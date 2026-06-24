using MediatR;
using Microsoft.EntityFrameworkCore;
using RevisionAI.Application.Common.Interfaces;
using RevisionAI.Application.Questions.Queries.GetQuestionDetail;

namespace RevisionAI.Application.Pyqs.Queries.GetPyqPaperQuestions;

public class GetPyqPaperQuestionsQueryHandler
    : IRequestHandler<GetPyqPaperQuestionsQuery, GetPyqPaperQuestionsResponse?>
{
    private readonly IAppDbContext _context;

    public GetPyqPaperQuestionsQueryHandler(IAppDbContext context)
    {
        _context = context;
    }

    public async Task<GetPyqPaperQuestionsResponse?> Handle(
        GetPyqPaperQuestionsQuery request,
        CancellationToken cancellationToken)
    {
        // Reuses the standard question-detail shape (same as /api/questions/{id}).
        // The frontend hides CorrectOption/Explanation until the user answers.
        List<QuestionDetailDto> questions = await _context.Questions
            .AsNoTracking()
            .Where(q => q.IsPYQ && q.ExamName == request.ExamName)
            .OrderBy(q => q.QuestionNumber)
            .Select(q => new QuestionDetailDto
            {
                Id = q.Id,
                QuestionNumber = q.QuestionNumber,
                QuestionText = q.QuestionText,
                OptionA = q.OptionA,
                OptionB = q.OptionB,
                OptionC = q.OptionC,
                OptionD = q.OptionD,
                CorrectOption = q.CorrectOption,
                Explanation = q.Explanation,
                HasMedia = q.HasMedia,
                SourcePage = q.SourcePage,
                SubjectName = q.Subject.Name,
                ChapterTitle = q.Chapter.Title,
                Media = q.Media.Select(m => new MediaDto
                {
                    Id = m.Id,
                    MediaType = m.MediaType,
                    Description = m.Description,
                    BlobUrl = m.BlobUrl,
                    PageNumber = m.PageNumber,
                    IsExplanation = m.IsExplanation
                }).ToList()
            })
            .ToListAsync(cancellationToken);

        if (questions.Count == 0)
        {
            return null;
        }

        return new GetPyqPaperQuestionsResponse
        {
            ExamName = request.ExamName,
            Data = questions
        };
    }
}
