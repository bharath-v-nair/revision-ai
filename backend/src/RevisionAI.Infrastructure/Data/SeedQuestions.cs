using System.Globalization;
using System.Text.Json;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using RevisionAI.Domain.Entities;

#pragma warning disable CA1848 // LoggerMessage delegates — not needed for one-time batch seeding
#pragma warning disable CA2254 // Expensive log message evaluation — acceptable for seed CLI
#pragma warning disable IDE0022 // Use expression body for method — readability for bulk mapping

namespace RevisionAI.Infrastructure.Data;

/// <summary>
/// Runtime seeding of validated pipeline JSON into PostgreSQL.
/// Invoked via: dotnet run --project src/RevisionAI.Api -- --seed {subjectName}
/// </summary>
public static class SeedQuestions
{
    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
    };

    /// <summary>
    /// Seeds all questions for a given subject from pipeline output.
    /// Returns (totalInserted, totalSkipped).
    /// </summary>
    public static async Task<(int Inserted, int Skipped)> SeedSubjectAsync(
        AppDbContext dbContext,
        ILogger logger,
        string subjectName,
        CancellationToken cancellationToken = default)
    {
        // Normalize: lowercase slug form
        string subjectSlug = subjectName.ToLowerInvariant();
        string subjectDisplayName = ResolveSubjectDisplayName(subjectSlug);

        logger.LogInformation("=== SeedQuestions: Starting {Subject} seeding ===", subjectDisplayName);

        // 1. Resolve the subject
        Subject? subject = await dbContext.Subjects
            .FirstOrDefaultAsync(s => EF.Functions.ILike(s.Slug, subjectSlug), cancellationToken);

        if (subject is null)
        {
            // Fallback: create from deterministic mapping
            int seed = GetSubjectSeed(subjectSlug);
            subject = new Subject
            {
                Id = CreateSubjectGuid(seed),
                Name = subjectDisplayName,
                Slug = subjectSlug,
            };
            dbContext.Subjects.Add(subject);
            await dbContext.SaveChangesAsync(cancellationToken);
            logger.LogInformation("Created {Subject} subject with Id: {SubjectId}", subjectDisplayName, subject.Id);
        }
        else
        {
            logger.LogInformation("Found existing {Subject} subject: {SubjectId}", subjectDisplayName, subject.Id);
        }

        // 2. Load audit report to identify failed questions
        string resolvedRoot = ResolvePipelineRoot(subjectSlug);
        logger.LogInformation("Pipeline output root: {Root}", resolvedRoot);

        // Load audit report
        string auditReportPath = Path.Combine(resolvedRoot, "audit_report.json");
        HashSet<(int ChapterNum, int QuestionNum)> failedQuestions = new();

        if (File.Exists(auditReportPath))
        {
            string auditJson = await File.ReadAllTextAsync(auditReportPath, cancellationToken);
            AuditReport? auditReport = JsonSerializer.Deserialize<AuditReport>(auditJson, JsonOptions);

            if (auditReport?.PerChapter is not null)
            {
                foreach (AuditChapter chapter in auditReport.PerChapter)
                {
                    if (chapter.Failures is not null)
                    {
                        foreach (AuditFailure failure in chapter.Failures)
                        {
                            failedQuestions.Add((chapter.ChapterNumber, failure.QuestionNumber));
                        }
                    }
                }
                logger.LogInformation("Loaded {Count} failed questions from audit report", failedQuestions.Count);
            }
        }
        else
        {
            logger.LogWarning("audit_report.json not found at {Path} — all questions will be inserted", auditReportPath);
        }

        // 3. Discover chapter JSON files (both patterns)
        List<string> jsonFiles = DiscoverJsonFiles(resolvedRoot);
        logger.LogInformation("Discovered {Count} chapter JSON files", jsonFiles.Count);

        int totalInserted = 0;
        int totalSkipped = 0;

        // 4. Process each JSON file
        foreach (string jsonPath in jsonFiles.OrderBy(f => f, StringComparer.Ordinal))
        {
            try
            {
                string jsonContent = await File.ReadAllTextAsync(jsonPath, cancellationToken);
                ChapterJson? chapterJson = JsonSerializer.Deserialize<ChapterJson>(jsonContent, JsonOptions);

                if (chapterJson is null || chapterJson.Questions is null || chapterJson.Questions.Count == 0)
                {
                    logger.LogWarning("Empty or invalid JSON: {Path}", jsonPath);
                    continue;
                }

                // Fallback: if chapterNumber is 0/null in JSON, derive from filename
                if (chapterJson.ChapterNumber == 0)
                {
                    chapterJson.ChapterNumber = ExtractChapterNumberFromPath(jsonPath);
                }

                logger.LogInformation(
                    "Processing Chapter {Num}: {Title} ({Count} questions)",
                    chapterJson.ChapterNumber,
                    chapterJson.ChapterTitle ?? "(unknown)",
                    chapterJson.Questions.Count);

                // Find or create Chapter
                Chapter chapter = await FindOrCreateChapterAsync(
                    dbContext, subject.Id, chapterJson, cancellationToken);

                // Process questions
                List<Question> newQuestions = new();
                List<QuestionMedia> newMedia = new();
                int chapterInserted = 0;
                int chapterSkipped = 0;

                foreach (QuestionJson qj in chapterJson.Questions)
                {
                    // Skip failed questions
                    if (failedQuestions.Contains((chapterJson.ChapterNumber, qj.QuestionNumber)))
                    {
                        chapterSkipped++;
                        LogSkippedQuestion(logger, chapterJson.ChapterNumber, qj.QuestionNumber);
                        continue;
                    }

                    // Map JSON to Question entity
                    Question question = MapQuestion(qj, subject.Id, chapter.Id);
                    newQuestions.Add(question);

                    // Map media arrays (tolerant: handle malformed entries)
                    string mediaPrefix = $"/media/{subjectSlug}/chapter_{chapterJson.ChapterNumber}/";
                    if (qj.Media is { Count: > 0 })
                    {
                        foreach (JsonElement element in qj.Media)
                        {
                            MediaJson? media = TryDeserializeMedia(element);
                            if (media is not null)
                            {
                                newMedia.Add(MapMedia(media, question.Id, isExplanation: false, mediaPrefix));
                            }
                        }
                    }

                    if (qj.ExplanationMedia is { Count: > 0 })
                    {
                        foreach (JsonElement element in qj.ExplanationMedia)
                        {
                            MediaJson? media = TryDeserializeMedia(element);
                            if (media is not null)
                            {
                                newMedia.Add(MapMedia(media, question.Id, isExplanation: true, mediaPrefix));
                            }
                        }
                    }

                    chapterInserted++;
                }

                // Bulk insert this chapter's questions and media
                if (newQuestions.Count > 0)
                {
                    await dbContext.Questions.AddRangeAsync(newQuestions, cancellationToken);
                    await dbContext.SaveChangesAsync(cancellationToken);

                    if (newMedia.Count > 0)
                    {
                        await dbContext.QuestionMedia.AddRangeAsync(newMedia, cancellationToken);
                        await dbContext.SaveChangesAsync(cancellationToken);
                    }

                    logger.LogInformation(
                        "  Chapter {Num}: Inserted {Inserted} questions, {Media} media, Skipped {Skipped}",
                        chapterJson.ChapterNumber, chapterInserted, newMedia.Count, chapterSkipped);
                }

                totalInserted += chapterInserted;
                totalSkipped += chapterSkipped;
            }
            catch (Exception ex)
            {
                logger.LogError(ex, "Failed to process {Path}", jsonPath);
            }
        }

        // 5. Verification summary
        int dbQuestionCount = await dbContext.Questions
            .CountAsync(q => q.SubjectId == subject.Id, cancellationToken);
        int dbChapterCount = await dbContext.Chapters
            .CountAsync(c => c.SubjectId == subject.Id, cancellationToken);
        int dbMediaCount = await dbContext.QuestionMedia
            .CountAsync(m => m.Question.SubjectId == subject.Id, cancellationToken);

        logger.LogInformation("=== SeedQuestions: {Subject} seeding complete ===", subjectDisplayName);
        logger.LogInformation("  Questions inserted: {Inserted}", totalInserted);
        logger.LogInformation("  Questions skipped:  {Skipped}", totalSkipped);
        logger.LogInformation("  DB Question count:  {Count}", dbQuestionCount);
        logger.LogInformation("  DB Chapter count:   {Count}", dbChapterCount);
        logger.LogInformation("  DB Media count:     {Count}", dbMediaCount);

        return (totalInserted, totalSkipped);
    }

    /// <summary>
    /// Maps subject slug to the display name used in Subjects table.
    /// </summary>
    private static string ResolveSubjectDisplayName(string slug)
    {
        return slug switch
        {
            "anaesthesia" => "Anaesthesia",
            "anatomy" => "Anatomy",
            "biochemistry" => "Biochemistry",
            "community-medicine" => "Community Medicine",
            "dermatology" => "Dermatology",
            "ent" => "ENT",
            "forensic-medicine" => "Forensic Medicine",
            "medicine" => "Medicine",
            "microbiology" => "Microbiology",
            "ob-gyn" => "OB GYN",
            "ophthalmology" => "Ophthalmology",
            "orthopedics" => "Orthopedics",
            "pathology" => "Pathology",
            "pediatrics" => "Pediatrics",
            "pharmacology" => "Pharmacology",
            "physiology" => "Physiology",
            "psychiatry" => "Psychiatry",
            "radiology" => "Radiology",
            "surgery" => "Surgery",
            _ => char.ToUpperInvariant(slug[0]) + slug[1..],
        };
    }

    /// <summary>
    /// Returns the seed index matching SeedData.Subjects array order (1-based).
    /// </summary>
    private static int GetSubjectSeed(string slug)
    {
        return slug switch
        {
            "anaesthesia" => 1,
            "anatomy" => 2,
            "biochemistry" => 3,
            "community-medicine" => 4,
            "dermatology" => 5,
            "ent" => 6,
            "forensic-medicine" => 7,
            "medicine" => 8,
            "microbiology" => 9,
            "ob-gyn" => 10,
            "ophthalmology" => 11,
            "orthopedics" => 12,
            "pathology" => 13,
            "pediatrics" => 14,
            "pharmacology" => 15,
            "physiology" => 16,
            "psychiatry" => 17,
            "radiology" => 18,
            "surgery" => 19,
            _ => 1,
        };
    }

    private static string ResolvePipelineRoot(string subjectSlug)
    {
        string cwd = Directory.GetCurrentDirectory();

        // Walk upward to find pipeline/output/{subject}
        string? current = Path.GetFullPath(cwd);
        for (int i = 0; i < 10; i++)
        {
            string test = Path.Combine(current, "pipeline", "output", subjectSlug);
            if (Directory.Exists(test))
            {
                return test;
            }
            string? parent = Path.GetDirectoryName(current);
            if (parent is null || parent == current) break;
            current = parent;
        }

        // Fallback: try explicit relative paths
        string[] explicitCandidates =
        [
            Path.Combine(cwd, "..", "..", "..", "..", "..", "..", "..", "pipeline", "output", subjectSlug),
            Path.Combine(cwd, "..", "..", "..", "pipeline", "output", subjectSlug),
            Path.Combine(cwd, "pipeline", "output", subjectSlug),
        ];

        foreach (string candidate in explicitCandidates)
        {
            string full = Path.GetFullPath(candidate);
            if (Directory.Exists(full))
            {
                return full;
            }
        }

        return Path.GetFullPath(Path.Combine(cwd, "pipeline", "output", subjectSlug));
    }

    private static List<string> DiscoverJsonFiles(string root)
    {
        List<string> files = new();

        // Scan all subdirectories matching chapter_{N}/chapter_{N}_questions.json
        for (int i = 1; i <= 100; i++)
        {
            string subDirPath = Path.Combine(root, $"chapter_{i}", $"chapter_{i}_questions.json");
            if (File.Exists(subDirPath))
            {
                files.Add(subDirPath);
            }

            // Also check for flat chapter_{N}_questions.json
            string flatPath = Path.Combine(root, $"chapter_{i}_questions.json");
            if (File.Exists(flatPath))
            {
                files.Add(flatPath);
            }

            // Skip *_draft.json variants
            string draftPath = Path.Combine(root, $"chapter_{i}", $"chapter_{i}_questions_draft.json");
            if (File.Exists(draftPath))
            {
                // Don't add — draft files are skipped
            }
        }

        return files.Distinct().ToList();
    }

    private static async Task<Chapter> FindOrCreateChapterAsync(
        AppDbContext dbContext,
        Guid subjectId,
        ChapterJson chapterJson,
        CancellationToken cancellationToken)
    {
        Chapter? chapter = await dbContext.Chapters
            .FirstOrDefaultAsync(
                c => c.SubjectId == subjectId && c.ChapterNumber == chapterJson.ChapterNumber,
                cancellationToken);

        if (chapter is not null)
        {
            if (chapter.Title != chapterJson.ChapterTitle)
            {
                chapter.Title = chapterJson.ChapterTitle ?? "(unknown)";
            }

            if (chapterJson.SourcePages is not null)
            {
                chapter.StartPage = chapterJson.SourcePages.Start;
                chapter.EndPage = chapterJson.SourcePages.End;
            }

            return chapter;
        }

        chapter = new Chapter
        {
            Id = Guid.NewGuid(),
            SubjectId = subjectId,
            ChapterNumber = chapterJson.ChapterNumber,
            Title = chapterJson.ChapterTitle ?? "(unknown)",
            StartPage = chapterJson.SourcePages?.Start ?? 0,
            EndPage = chapterJson.SourcePages?.End ?? 0,
        };

        dbContext.Chapters.Add(chapter);
        await dbContext.SaveChangesAsync(cancellationToken);
        return chapter;
    }

    private static Question MapQuestion(QuestionJson json, Guid subjectId, Guid chapterId) => new()
    {
        Id = Guid.NewGuid(),
        SubjectId = subjectId,
        ChapterId = chapterId,
        TopicId = null,
        QuestionNumber = json.QuestionNumber,
        QuestionText = json.QuestionText ?? string.Empty,
        OptionA = GetOptionValue(json.Options, "a") ?? GetOptionValue(json.Options, "A") ?? string.Empty,
        OptionB = GetOptionValue(json.Options, "b") ?? GetOptionValue(json.Options, "B") ?? string.Empty,
        OptionC = GetOptionValue(json.Options, "c") ?? GetOptionValue(json.Options, "C") ?? string.Empty,
        OptionD = GetOptionValue(json.Options, "d") ?? GetOptionValue(json.Options, "D") ?? string.Empty,
        CorrectOption = (json.CorrectOption ?? "a").ToUpperInvariant()[0],
        Explanation = json.Explanation ?? string.Empty,
        Difficulty = null,
        SourcePage = json.SourcePage,
        HasMedia = json.HasMedia,
        IsPYQ = false,
        ExamName = null,
        CreatedAt = DateTime.UtcNow,
    };

    private static string? GetOptionValue(
        Dictionary<string, JsonElement>? options,
        string key) =>
        options is not null && options.TryGetValue(key, out JsonElement element)
            ? element.ValueKind switch
            {
                JsonValueKind.String => element.GetString(),
                JsonValueKind.Null => null,
                _ => element.ToString(),
            }
            : null;

    private static QuestionMedia MapMedia(MediaJson media, Guid questionId, bool isExplanation, string mediaPrefix = "") => new()
    {
        Id = Guid.NewGuid(),
        QuestionId = questionId,
        MediaType = media.MediaType ?? "ClinicalImage",
        Description = media.Description,
        BlobUrl = string.IsNullOrEmpty(media.Filename) ? string.Empty : mediaPrefix + media.Filename,
        PageNumber = media.PageNumber,
        IsExplanation = isExplanation,
    };

    private static int ExtractChapterNumberFromPath(string jsonPath)
    {
        string fileName = Path.GetFileNameWithoutExtension(jsonPath);
        System.Text.RegularExpressions.Match match = System.Text.RegularExpressions.Regex.Match(
            fileName, @"chapter_(\d+)");
        if (match.Success)
        {
            return int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
        }

        string? dirName = Path.GetDirectoryName(jsonPath);
        if (dirName is not null)
        {
            match = System.Text.RegularExpressions.Regex.Match(
                Path.GetFileName(dirName), @"chapter_(\d+)");
            if (match.Success)
            {
                return int.Parse(match.Groups[1].Value, CultureInfo.InvariantCulture);
            }
        }

        return 0;
    }

    private static MediaJson? TryDeserializeMedia(JsonElement element)
    {
        try
        {
            if (element.ValueKind == JsonValueKind.Object)
            {
                return JsonSerializer.Deserialize<MediaJson>(element.GetRawText(), JsonOptions);
            }

            return null;
        }
        catch
        {
            return null;
        }
    }

    private static void LogSkippedQuestion(ILogger logger, int chapterNum, int questionNum) =>
        logger.LogWarning(
            "  SKIPPED Chapter {ChapterNum} Question {QuestionNum} (flagged in audit report)",
            chapterNum,
            questionNum);

    private static Guid CreateSubjectGuid(int seed)
    {
        byte[] bytes = new byte[16];
        bytes[0] = (byte)(seed >> 24);
        bytes[1] = (byte)(seed >> 16);
        bytes[2] = (byte)(seed >> 8);
        bytes[3] = (byte)seed;
        for (int i = 4; i < 16; i++)
        {
            bytes[i] = (byte)((seed * 31) + i);
        }
        return new Guid(bytes);
    }

    // ---- JSON deserialization types ----

    private sealed class AuditReport
    {
        public string? Subject { get; set; }
        public AuditSummary? Summary { get; set; }
        public List<AuditChapter>? PerChapter { get; set; }
    }

    private sealed class AuditSummary
    {
        public int TotalQuestionsTested { get; set; }
        public int Passed { get; set; }
        public int Failed { get; set; }
        public double PassRate { get; set; }
    }

    private sealed class AuditChapter
    {
        public int ChapterNumber { get; set; }
        public string? ChapterTitle { get; set; }
        public int TotalQuestions { get; set; }
        public int Passed { get; set; }
        public int Failed { get; set; }
        public List<AuditFailure>? Failures { get; set; }
    }

    private sealed class AuditFailure
    {
        public int QuestionNumber { get; set; }
        public List<AuditError>? Errors { get; set; }
    }

    private sealed class AuditError
    {
        public string? Check { get; set; }
        public string? Detail { get; set; }
    }

    private sealed class ChapterJson
    {
        public string? Subject { get; set; }
        public string? ChapterTitle { get; set; }
        public int ChapterNumber { get; set; }
        public SourcePagesJson? SourcePages { get; set; }
        public List<QuestionJson>? Questions { get; set; }
    }

    private sealed class SourcePagesJson
    {
        public int Start { get; set; }
        public int End { get; set; }
    }

    private sealed class QuestionJson
    {
        public int QuestionNumber { get; set; }
        public string? QuestionText { get; set; }
        public int SourcePage { get; set; }
        public Dictionary<string, JsonElement>? Options { get; set; }
        public string? CorrectOption { get; set; }
        public string? Explanation { get; set; }
        public bool HasMedia { get; set; }
        public bool ExplanationHasMedia { get; set; }
        public List<JsonElement>? Media { get; set; }
        public List<JsonElement>? ExplanationMedia { get; set; }
    }

    private sealed class MediaJson
    {
        public string? MediaType { get; set; }
        public string? Description { get; set; }
        public string? Filename { get; set; }
        public int PageNumber { get; set; }
    }
}