import { useQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { getParticipants, getTournamentPredictions } from '@/api';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

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
                <TableCell>{pr.Winner}</TableCell>
                <TableCell>{pr.RunnerUp}</TableCell>
                <TableCell>{pr.ThirdPlace}</TableCell>
                <TableCell>{pr.FourthPlace}</TableCell>
                <TableCell>{pr.TopScorer}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </>
  );
}
