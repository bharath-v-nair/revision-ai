using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class QuestionMediaConfiguration : IEntityTypeConfiguration<QuestionMedia>
{
    public void Configure(EntityTypeBuilder<QuestionMedia> builder)
    {
        builder.ToTable("QuestionMedia");

        builder.HasKey(m => m.Id);

        builder.Property(m => m.MediaType)
            .IsRequired()
            .HasMaxLength(50);

        builder.Property(m => m.Description)
            .HasMaxLength(500);

        builder.Property(m => m.BlobUrl)
            .IsRequired()
            .HasMaxLength(2048);

        builder.Property(m => m.PageNumber)
            .IsRequired();

        builder.HasOne(m => m.Question)
            .WithMany(q => q.Media)
            .HasForeignKey(m => m.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(m => m.QuestionId);
    }
}