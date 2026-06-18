import { createFileRoute } from '@tanstack/react-router';
import { useGetParticipants } from '@/api/generated';
import { FlagCell } from '@/components/FlagDisplay';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/pageTitle';
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

  return (
    <div className="p-3">
      <PageTitle>Tournament Predictions</PageTitle>
      <Card>
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
                <TableRow key={p.name} className="[&>td:not(:first-child)]:text-right">
                  <TableCell className="font-bold">{p.name}</TableCell>
                  <FlagCell text={preds.winner} />
                  <FlagCell text={preds.runnerUp} />
                  <FlagCell text={preds.thirdPlace} />
                  <FlagCell text={preds.fourthPlace} />
                  <FlagCell text={preds.topScorer} code={preds.scorerNationality} />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}
