import { createFileRoute } from '@tanstack/react-router';
import { useMatches, useParticipants } from '@/api/hooks';
import { ErrorCard } from '@/components/ErrorCard';
import { MatchesList } from '@/components/MatchesList';
import { PageTitle } from '@/components/ui/pageTitle';
import { Spinner } from '@/components/ui/spinner';

const RouteComponent = () => {
  const { data: matchesResp, isPending: matchesPending, error: matchesError } = useMatches();
  const {
    data: participants,
    isPending: participantsPending,
    error: participantsError,
  } = useParticipants();

  if (matchesPending || participantsPending || !matchesResp || !participants) {
    return <Spinner className="size-16" />;
  }

  if (matchesError || participantsError) {
    <ErrorCard error={matchesError || participantsError} />;
  }

  return (
    <div>
      <PageTitle>Matches</PageTitle>
      <MatchesList matches={matchesResp} />
    </div>
  );
};

export const Route = createFileRoute('/matches/')({
  component: RouteComponent,
});
