using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RevisionAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsExplanationToQuestionMedia : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsExplanation",
                table: "QuestionMedia",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            // Fix existing rows: seed data filenames use img_N_eN_N pattern for explanation media
            migrationBuilder.Sql(
                "UPDATE \"QuestionMedia\" SET \"IsExplanation\" = TRUE WHERE \"BlobUrl\" ~ '^img_[0-9]+_e';"
            );
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsExplanation",
                table: "QuestionMedia");
        }
    }
}
