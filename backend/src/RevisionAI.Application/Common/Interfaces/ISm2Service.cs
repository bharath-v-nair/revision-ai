namespace RevisionAI.Application.Common.Interfaces;

public interface ISm2Service
{
    Sm2Result Calculate(bool isCorrect, double currentEaseFactor, int currentInterval, int currentRepetitions);
}

public class Sm2Result
{
    public double NewEaseFactor { get; init; }
    public int NewInterval { get; init; }
    public DateTime NextReviewDate { get; init; }
}