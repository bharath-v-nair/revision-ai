using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class TopicConfiguration : IEntityTypeConfiguration<Topic>
{
    public void Configure(EntityTypeBuilder<Topic> builder)
    {
        builder.ToTable("Topics");

        builder.HasKey(t => t.Id);

        builder.Property(t => t.Title)
            .IsRequired()
            .HasMaxLength(500);

        builder.HasOne(t => t.Chapter)
            .WithMany(c => c.Topics)
            .HasForeignKey(t => t.ChapterId)
            .OnDelete(DeleteBehavior.Restrict);

        builder.HasIndex(t => t.ChapterId);
    }
}