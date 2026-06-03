using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data.Configurations;

public class BookmarkCollectionConfiguration : IEntityTypeConfiguration<BookmarkCollection>
{
    public void Configure(EntityTypeBuilder<BookmarkCollection> builder)
    {
        builder.ToTable("BookmarkCollections");

        builder.HasKey(b => b.Id);

        builder.Property(b => b.Name)
            .IsRequired()
            .HasMaxLength(200);

        builder.Property(b => b.Icon)
            .HasMaxLength(10);

        builder.Property(b => b.CreatedAt)
            .IsRequired();

        builder.HasOne(b => b.User)
            .WithMany(u => u.BookmarkCollections)
            .HasForeignKey(b => b.UserId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.HasIndex(b => b.UserId);
    }
}