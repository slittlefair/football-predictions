import { createFileRoute, useParams } from '@tanstack/react-router';
import { useGetMatches, useGetParticipant } from '@/api/generated';
import { FlagCell } from '@/components/FlagDisplay';
import { MatchesList } from '@/components/MatchesList';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/participants/$name')({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = useParams({ from: '/participants/$name' });
  const { data: participantResp } = useGetParticipant(name);
  const { data: matchesResp } = useGetMatches();

  if (!participantResp?.data) {
    return null;
  }

  const participant = participantResp.data;
  const { winner, runnerUp, thirdPlace, fourthPlace, topScorer, scorerNationality } =
    participant.tournamentPredictions;

  return (
    <div>
      <h3>{participant.name}</h3>

      <div className="p-3">
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
      </div>

      {matchesResp && (
        <MatchesList matches={matchesResp.data} predictions={participant.predictions} />
      )}
    </div>
  );
}
