import { createFileRoute } from '@tanstack/react-router';
import { addDays, endOfDay, isAfter, isBefore } from 'date-fns';
import { useMatches, useParticipants } from '@/api/hooks';
import { MatchesList } from '@/components/MatchesList';
import { PageTitle } from '@/components/ui/pageTitle';
import { Spinner } from '@/components/ui/spinner';

export const Route = createFileRoute('/missingPredictions')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: matches, isPending: matchesPending, error: matchesError } = useMatches();
  const {
    data: participants,
    isPending: participantsPending,
    error: partisipantsError,
  } = useParticipants();

  if (matchesPending || participantsPending || !matches || !participants) {
    return <Spinner className="size-16" />;
  }

  if (matchesError || partisipantsError) {
    return <p>Error</p>;
  }

  const now = new Date();

  const filteredMatches = matches.filter(m => {
    const d = new Date(m.date);
    return isAfter(d, now) && isBefore(d, endOfDay(addDays(now, 1)));
  });

  const missingPredictions: Record<number, string[]> = {};

  if (participants) {
    for (const m of filteredMatches) {
      const missingPreds: string[] = [];
      for (const p of participants) {
        const pred = p.predictions.find(p => p.id === m.id);
        if (pred === undefined || pred.homeScore === undefined || pred.awayScore === undefined) {
          missingPreds.push(p.name);
        }
      }
      missingPredictions[m.id] = missingPreds;
    }
  }

  return (
    <div>
      <PageTitle>Missing Predictions</PageTitle>
      <MatchesList matches={filteredMatches} missingPredictions={missingPredictions} />
    </div>
  );
}
