using RevisionAI.Application.Common.Interfaces;

namespace RevisionAI.Infrastructure.Services;

public class Sm2Service : ISm2Service
{
    private const double DefaultEaseFactor = 2.5;
    private const double MinimumEaseFactor = 1.3;
    private const double MaximumEaseFactor = 3.0;
    private const double EaseIncrement = 0.1;
    private const double EaseDecrement = 0.2;
    private const int MaximumIntervalDays = 365;

    public Sm2Result Calculate(bool isCorrect, double currentEaseFactor, int currentInterval, int currentRepetitions)
    {
        DateTime utcNow = DateTime.UtcNow;
        double newEaseFactor;
        int newInterval;
        int newRepetitions;

        if (isCorrect)
        {
            newRepetitions = currentRepetitions + 1;
            newEaseFactor = Math.Min(MaximumEaseFactor, currentEaseFactor + EaseIncrement);

            if (currentRepetitions == 0)
            {
                newInterval = 1;
            }
            else if (currentRepetitions == 1)
            {
                newInterval = 6;
            }
            else
            {
                double rawInterval = Math.Ceiling(currentInterval * newEaseFactor);
                newInterval = (int)Math.Min(MaximumIntervalDays, rawInterval);
            }
        }
        else
        {
            newRepetitions = 0;
            newEaseFactor = Math.Max(MinimumEaseFactor, currentEaseFactor - EaseDecrement);
            newInterval = 1;
        }

        DateTime nextReviewDate = utcNow.AddDays(newInterval).Date;

        return new Sm2Result
        {
            NewEaseFactor = Math.Round(newEaseFactor, 2),
            NewInterval = newInterval,
            NextReviewDate = nextReviewDate
        };
    }
}