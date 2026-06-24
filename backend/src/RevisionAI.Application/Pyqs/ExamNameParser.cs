using System.Globalization;
using System.Text.RegularExpressions;

namespace RevisionAI.Application.Pyqs;

/// <summary>
/// Derives examType + examYear from a PYQ ExamName string.
/// e.g. "AIIMS 2017" -> (AIIMS, 2017); "AIIMS 2019 (May &amp; Nov)" -> (AIIMS, 2019).
/// </summary>
public static class ExamNameParser
{
    private static readonly Regex YearPattern = new(@"\d{4}", RegexOptions.Compiled);

    public static (string ExamType, int ExamYear) Parse(string? examName)
    {
        string name = (examName ?? string.Empty).Trim();
        Match match = YearPattern.Match(name);

        if (!match.Success)
        {
            return (name, 0);
        }

        int year = int.Parse(match.Value, CultureInfo.InvariantCulture);
        string type = name[..match.Index].Trim();
        return (type, year);
    }
}
