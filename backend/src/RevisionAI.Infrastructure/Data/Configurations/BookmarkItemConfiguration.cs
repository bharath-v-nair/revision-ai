using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class BookmarkItemConfiguration : IEntityTypeConfiguration<BookmarkItem>
{
    public void Configure(EntityTypeBuilder<BookmarkItem> builder)
    {
        builder.ToTable("BookmarkItems");

        builder.HasKey(i => i.Id);

        builder.Property(i => i.CreatedAt)
            .IsRequired();

        builder.HasOne(i => i.Collection)
            .WithMany(c => c.Items)
            .HasForeignKey(i => i.CollectionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasOne(i => i.Question)
            .WithMany(q => q.BookmarkItems)
            .HasForeignKey(i => i.QuestionId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(i => i.CollectionId);
        builder.HasIndex(i => new { i.CollectionId, i.QuestionId }).IsUnique();
    }
}