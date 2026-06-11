import { faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createFileRoute } from '@tanstack/react-router';
import { useGetParticipants } from '@/api/generated';
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
  const { data: participantsData } = useGetParticipants();
  if (!participantsData?.data) {
    return null;
  }

  const { data: participants } = participantsData;

  const cellContent = (s?: string) => s || <FontAwesomeIcon color="red" icon={faWarning} />;

  return (
    <div className="p-3">
      <h3 className="display-title font-bold">Tournament Predictions</h3>
      <Table className="w-2xl m-3">
        <TableHeader className="[&_th]:font-bold">
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
            const preds = p.tournamentPredictions;
            return (
              <TableRow key={p.name}>
                <TableCell className="font-bold">{p.name}</TableCell>
                <TableCell>{cellContent(preds.winner)}</TableCell>
                <TableCell>{cellContent(preds.runnerUp)}</TableCell>
                <TableCell>{cellContent(preds.thirdPlace)}</TableCell>
                <TableCell>{cellContent(preds.fourthPlace)}</TableCell>
                <TableCell>{cellContent(preds.topScorer)}</TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
