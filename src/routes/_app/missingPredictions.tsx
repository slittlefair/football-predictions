import { createFileRoute } from '@tanstack/react-router';
import { addDays, endOfDay, isAfter, isBefore } from 'date-fns';
import { useMatches, useParticipants, usePredictions } from '@/api/hooks';
import { ErrorCard } from '@/components/ErrorCard';
import { PageTitle } from '@/components/ui/pageTitle';
import { Spinner } from '@/components/ui/spinner';
import { MatchesList } from '@/views/MatchesList';

export const Route = createFileRoute('/_app/missingPredictions')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: matches, isPending: matchesPending, error: matchesError } = useMatches();
  const {
    data: participants,
    isPending: participantsPending,
    error: participantsError,
  } = useParticipants();
  const {
    data: predictions,
    isPending: predictionsPending,
    error: predictionsError,
  } = usePredictions();

  const isPending = matchesPending || participantsPending || predictionsPending;
  const error = matchesError || participantsError || predictionsError;
  const loaded = matches && participants && predictions;

  if (isPending || !loaded) {
    return <Spinner className="size-16" />;
  }

  if (error) {
    return <ErrorCard error={error} />;
  }

  const now = new Date();

  const filteredMatches = matches.filter(m => {
    const d = new Date(m.date);
    return isAfter(d, now) && isBefore(d, endOfDay(addDays(now, 1)));
  });

  const missingPredictions: Record<number, string[]> = {};
  const participantsNames = participants.map(p => p.name);

  for (const m of filteredMatches) {
    const missingPreds: string[] = [];
    const filteredPredictions = predictions.filter(p => p.id === m.id);
    if (participantsNames.length !== filteredPredictions.length) {
      participantsNames.forEach(pn => {
        if (!filteredPredictions.find(fp => fp.participant === pn)) {
          missingPreds.push(pn);
        }
      });
    }
    missingPredictions[m.id] = missingPreds;
  }

  return (
    <div>
      <PageTitle>Missing Predictions</PageTitle>
      <MatchesList matches={filteredMatches} missingPredictions={missingPredictions} />
    </div>
  );
}
