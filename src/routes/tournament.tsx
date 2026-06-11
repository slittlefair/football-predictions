import { getParticipants, getTournamentPredictions } from '@/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/tournament')({
  component: RouteComponent,
});

function RouteComponent() {
  const { data: tournamentPredictions } = useQuery({
    queryKey: ['tournamentPredictions'],
    queryFn: getTournamentPredictions,
  });
  const { data: participants } = useQuery({
    queryKey: ['participants'],
    queryFn: getParticipants,
  });
  if (!participants || !tournamentPredictions) {
    return null;
  }

  const cellContent = (s?: string) => s || <FontAwesomeIcon color="red" icon={faWarning} />

  return (
    <>
      <h3 className="display-title">Tournament Predictions</h3>
      <Table className="w-2xl">
        <TableHeader>
          <TableRow>
            <TableHead />
            <TableHead>Winner</TableHead>
            <TableHead>Runner Up</TableHead>
            <TableHead>Third Place</TableHead>
            <TableHead>Fourth Place</TableHead>
            <TableHead>Top Scorer</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {participants.map(p => {
            const pr = tournamentPredictions[p];
            if (!pr) {
              return null;
            }
            return (
              <TableRow key={p}>
                <TableCell>{p}</TableCell>
                <TableCell>{cellContent(pr.Winner)}</TableCell>
                <TableCell>{cellContent(pr.RunnerUp)}</TableCell>
                <TableCell>{cellContent(pr.ThirdPlace)}</TableCell>
                <TableCell>{cellContent(pr.FourthPlace)}</TableCell>
                <TableCell>{cellContent(pr.TopScorer)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
