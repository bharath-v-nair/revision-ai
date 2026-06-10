using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RevisionAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class UpdateBlobUrlWithMediaPath : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Update bare filename BlobUrls to /media/{subject}/chapter_{N}/{filename}
            // Only touches rows that are still bare filenames (not already prefixed with / or http)
            migrationBuilder.Sql(@"
                UPDATE ""QuestionMedia"" qm
                SET ""BlobUrl"" = '/media/' || lower(s.""Slug"") || '/chapter_' || c.""ChapterNumber"" || '/' || qm.""BlobUrl""
                FROM ""Questions"" q
                JOIN ""Chapters"" c ON q.""ChapterId"" = c.""Id""
                JOIN ""Subjects"" s ON q.""SubjectId"" = s.""Id""
                WHERE qm.""QuestionId"" = q.""Id""
                  AND qm.""BlobUrl"" NOT LIKE '/%'
                  AND qm.""BlobUrl"" NOT LIKE 'http%';
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Strip the /media/{subject}/chapter_{N}/ prefix back to bare filename
            migrationBuilder.Sql(@"
                UPDATE ""QuestionMedia""
                SET ""BlobUrl"" = regexp_replace(""BlobUrl"", '^/media/[^/]+/chapter_[0-9]+/', '')
                WHERE ""BlobUrl"" LIKE '/media/%';
            ");
        }
    }
}
