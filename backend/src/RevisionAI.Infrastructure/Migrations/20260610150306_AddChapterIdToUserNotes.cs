using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace RevisionAI.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddChapterIdToUserNotes : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<Guid>(
                name: "ChapterId",
                table: "UserNotes",
                type: "uuid",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_UserNotes_ChapterId",
                table: "UserNotes",
                column: "ChapterId");

            migrationBuilder.AddForeignKey(
                name: "FK_UserNotes_Chapters_ChapterId",
                table: "UserNotes",
                column: "ChapterId",
                principalTable: "Chapters",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_UserNotes_Chapters_ChapterId",
                table: "UserNotes");

            migrationBuilder.DropIndex(
                name: "IX_UserNotes_ChapterId",
                table: "UserNotes");

            migrationBuilder.DropColumn(
                name: "ChapterId",
                table: "UserNotes");
        }
    }
}
