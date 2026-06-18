import { createFileRoute } from '@tanstack/react-router';
import { addDays, endOfDay, isAfter, isBefore } from 'date-fns';
import { useGetMatches, useGetParticipants } from '@/api/generated';
import { MatchesList } from '@/components/MatchesList';
import { PageTitle } from '@/components/ui/pageTitle';

export const Route = createFileRoute('/missingPredictions')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: matches } = useGetMatches();
  const { data: participants } = useGetParticipants();

  if (!matches) {
    return null;
  }

  const now = new Date();

  const filteredMatches = matches?.data.filter(m => {
    const d = new Date(m.date);
    return isAfter(d, now) && isBefore(d, endOfDay(addDays(now, 1)));
  });

  const missingPredictions: Record<number, string[]> = {};

  if (participants?.data) {
    for (const m of filteredMatches) {
      const missingPreds: string[] = [];
      for (const p of participants.data) {
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
