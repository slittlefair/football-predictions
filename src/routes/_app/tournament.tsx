import { createFileRoute } from '@tanstack/react-router';
import { useParticipants } from '@/api/hooks';
import { FlagCell } from '@/components/FlagDisplay';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/pageTitle';
import { Spinner } from '@/components/ui/spinner';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/_app/tournament')({
  component: RouteComponent,
});

type TournamentResults = {
  Winner?: string;
  RunnerUp?: string;
  ThirdPlace?: string;
  FourthPlace?: string;
  TopScorer?: string;
};

const results = ['', '', 'England', 'France', ''];

function RouteComponent() {
  const { data: participants, isPending } = useParticipants();

  if (isPending || !participants) {
    return <Spinner className="size-16" />;
  }

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
                  <FlagCell text={preds.winner} className={bgClass(preds.winner, 0)} />
                  <FlagCell text={preds.runnerUp} className={bgClass(preds.runnerUp, 1)} />
                  <FlagCell text={preds.thirdPlace} className={bgClass(preds.thirdPlace, 2)} />
                  <FlagCell text={preds.fourthPlace} className={bgClass(preds.fourthPlace, 3)} />
                  <FlagCell
                    text={preds.topScorer}
                    code={preds.scorerNationality}
                    className={bgClass(preds.topScorer, 4)}
                  />
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

const bgClass = (content: string, idx: number) => {
  if (results[idx] === '') {
    return '';
  }
  if (content === results[idx]) {
    return 'bg-emerald-200';
  }
  if (results.includes(content)) {
    return 'bg-amber-200';
  }
  return 'bg-red-200';
};
