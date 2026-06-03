using Microsoft.EntityFrameworkCore;
using RevisionAI.Domain.Entities;

namespace RevisionAI.Infrastructure.Data;

public static class SeedData
{
    public static readonly (string Name, string Slug)[] Subjects =
    [
        ("Anaesthesia", "anaesthesia"),
        ("Anatomy", "anatomy"),
        ("Biochemistry", "biochemistry"),
        ("Community Medicine", "community-medicine"),
        ("Dermatology", "dermatology"),
        ("ENT", "ent"),
        ("Forensic Medicine", "forensic-medicine"),
        ("Medicine", "medicine"),
        ("Microbiology", "microbiology"),
        ("OB GYN", "ob-gyn"),
        ("Ophthalmology", "ophthalmology"),
        ("Orthopedics", "orthopedics"),
        ("Pathology", "pathology"),
        ("Pediatrics", "pediatrics"),
        ("Pharmacology", "pharmacology"),
        ("Physiology", "physiology"),
        ("Psychiatry", "psychiatry"),
        ("Radiology", "radiology"),
        ("Surgery", "surgery"),
    ];

    public static void SeedSubjects(ModelBuilder modelBuilder)
    {
        Subject[] subjects = Subjects.Select((s, i) => new Subject
        {
            Id = CreateSubjectGuid(i + 1),
            Name = s.Name,
            Slug = s.Slug,
            IconName = null,
        }).ToArray();

        modelBuilder.Entity<Subject>().HasData(subjects);
    }

    /// <summary>
    /// Creates a deterministic Guid from a small integer seed.
    /// This ensures migrations are repeatable.
    /// </summary>
    private static Guid CreateSubjectGuid(int seed)
    {
        byte[] bytes = new byte[16];
        // Fill first 4 bytes with the seed in big-endian
        bytes[0] = (byte)(seed >> 24);
        bytes[1] = (byte)(seed >> 16);
        bytes[2] = (byte)(seed >> 8);
        bytes[3] = (byte)seed;
        // Fill remaining bytes with a fixed pattern derived from the seed
        for (int i = 4; i < 16; i++)
        {
            bytes[i] = (byte)(seed * 31 + i);
        }
        return new Guid(bytes);
    }
}