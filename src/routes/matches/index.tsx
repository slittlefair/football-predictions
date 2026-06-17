import { createFileRoute } from '@tanstack/react-router';
import { useGetMatches, useGetParticipants } from '@/api/generated';
import { MatchesList } from '@/components/MatchesList';
import { PageTitle } from '@/components/ui/pageTitle';

const RouteComponent = () => {
  const { data, isLoading, error } = useGetMatches();
  const {
    data: participantsResp,
    isLoading: partsLoading,
    error: partsError,
  } = useGetParticipants();

  if (error || partsError) {
    return <p>Something went wrong</p>;
  }

  if (isLoading || !data || partsLoading || !participantsResp) {
    return <p>Loading...</p>;
  }

  return (
    <div>
      <PageTitle>Matches</PageTitle>
      <MatchesList matches={data.data} />
    </div>
  );
};

export const Route = createFileRoute('/matches/')({
  component: RouteComponent,
});
