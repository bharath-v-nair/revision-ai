using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class UserNoteConfiguration : IEntityTypeConfiguration<UserNote>
{
    public void Configure(EntityTypeBuilder<UserNote> builder)
    {
        builder.ToTable("UserNotes");

        builder.HasKey(n => n.Id);

        builder.Property(n => n.BlobUrl)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(n => n.NoteType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(n => n.CreatedAt)
            .IsRequired();

        builder.HasOne(n => n.User)
            .WithMany(u => u.UserNotes)
            .HasForeignKey(n => n.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(n => n.Question)
            .WithMany(q => q.UserNotes)
            .HasForeignKey(n => n.QuestionId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(n => n.Topic)
            .WithMany(t => t.UserNotes)
            .HasForeignKey(n => n.TopicId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasOne(n => n.Chapter)
            .WithMany()
            .HasForeignKey(n => n.ChapterId)
            .OnDelete(DeleteBehavior.SetNull);

        builder.HasIndex(n => n.UserId);
        builder.HasIndex(n => n.QuestionId);
        builder.HasIndex(n => n.TopicId);
        builder.HasIndex(n => n.ChapterId);
    }
}