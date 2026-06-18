import { createFileRoute, useParams } from '@tanstack/react-router';
import { useMatches, useParticipant } from '@/api/hooks';
import { ErrorCard } from '@/components/ErrorCard';
import { FlagCell } from '@/components/FlagDisplay';
import { MatchesList } from '@/components/MatchesList';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/pageTitle';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/participants/$name')({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = useParams({ from: '/participants/$name' });
  const { data: matchesResp, isPending: matchesPending, error: matchesError } = useMatches();
  const {
    data: participant,
    isPending: participantPending,
    error: participantError,
  } = useParticipant(name);

  if (participantPending || !participant) {
    return <Spinner className="size-16" />;
  }

  if (participantError || matchesError) {
    return <ErrorCard error={participantError || matchesError} />;
  }

  const { winner, runnerUp, thirdPlace, fourthPlace, topScorer, scorerNationality } =
    participant.tournamentPredictions;

  return (
    <div>
      <PageTitle>{participant.name}</PageTitle>
      <Card>
        <Table className="w-72">
          <TableBody>
            <TableRow>
              <TableCell>Winner</TableCell>
              <FlagCell text={winner} />
            </TableRow>
            <TableRow>
              <TableCell>Runner Up</TableCell>
              <FlagCell text={runnerUp} />
            </TableRow>
            <TableRow>
              <TableCell>Third Place</TableCell>
              <FlagCell text={thirdPlace} />
            </TableRow>
            <TableRow>
              <TableCell>Fourth Place</TableCell>
              <FlagCell text={fourthPlace} />
            </TableRow>
            <TableRow>
              <TableCell>TopScorer</TableCell>
              <FlagCell text={topScorer} code={scorerNationality} />
            </TableRow>
          </TableBody>
        </Table>
      </Card>

      {matchesPending && (
        <div className="flex justify-center p-4">
          <Spinner className="size-16" />
        </div>
      )}
      {matchesResp && <MatchesList matches={matchesResp} predictions={participant.predictions} />}
    </div>
  );
}
