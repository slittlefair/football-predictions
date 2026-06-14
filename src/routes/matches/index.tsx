import { createFileRoute } from '@tanstack/react-router';
import { useGetMatches, useGetParticipants } from '@/api/generated';
import { MatchesList } from '@/components/MatchesList';

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

  return <MatchesList matches={data.data} />;
};

export const Route = createFileRoute('/matches/')({
  component: RouteComponent,
});
