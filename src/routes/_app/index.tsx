import { faCaretDown, faCaretUp } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useLeaderboard } from '@/api/hooks';
import { ErrorCard } from '@/components/ErrorCard';
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

const queryClient = new QueryClient();

const LeaderBoard = () => {
  const { data: leaderboard, error, isPending } = useLeaderboard();
  const navigate = useNavigate();

  if (error) {
    return <ErrorCard error={error} />;
  }

  if (isPending || !leaderboard) {
    return <Spinner className="size-16" />;
  }

  return (
    <div className="max-w-3xl">
      <PageTitle>Leaderboard</PageTitle>
      <Card className="p-6">
        <Table className="table-fixed w-fit justify-self-center">
          <TableHeader>
            <TableRow>
              <TableHead className="w-16" />
              <TableHead className="w-24" />
              <TableHead className="w-14">P</TableHead>
              <TableHead className="w-14">JR</TableHead>
              <TableHead className="w-14">CS</TableHead>
              <TableHead className="w-14">CR</TableHead>
              <TableHead className="w-20">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboard.map(p => {
              const better = p.position < p.previousPosition;
              const worse = p.position > p.previousPosition;
              return (
                <TableRow
                  key={p.participant}
                  className="cursor-pointer"
                  onClick={() =>
                    navigate({ to: '/participants/$name', params: { name: p.participant } })
                  }
                >
                  <TableCell>
                    {p.position}
                    {better ? (
                      <FontAwesomeIcon icon={faCaretUp} className="ml-1 text-green-400" />
                    ) : worse ? (
                      <FontAwesomeIcon icon={faCaretDown} className="ml-1 text-red-400" />
                    ) : null}
                  </TableCell>
                  <TableCell>{p.participant}</TableCell>
                  <TableCell>{p.played}</TableCell>
                  <TableCell>{3 - p.jokersPlayed}</TableCell>
                  <TableCell>{p.correctScores}</TableCell>
                  <TableCell>{p.correctResults}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-lg">{p.totalPoints}</span> (+
                      {p.pointsDifference})
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
        <div className="text-sm">
          <strong>P</strong> = Played&nbsp;&nbsp;&nbsp;
          <strong>JR</strong> = Jokers Remaining&nbsp;&nbsp;&nbsp;
          <strong>CS</strong> = Correct Scores&nbsp;&nbsp;&nbsp;
          <strong>CR</strong> = Correct Results&nbsp;&nbsp;&nbsp;
        </div>
      </Card>
    </div>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LeaderBoard />
    </QueryClientProvider>
  );
};

export const Route = createFileRoute('/_app/')({ component: App });
