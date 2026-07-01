import { createFileRoute, useParams } from '@tanstack/react-router';
import { useMatches, useParticipant, usePredictions } from '@/api/hooks';
import { ErrorCard } from '@/components/ErrorCard';
import { FlagCell } from '@/components/FlagDisplay';
import { Card } from '@/components/ui/card';
import { PageTitle } from '@/components/ui/pageTitle';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MatchesList } from '@/views/MatchesList';
import { ParticipantPredictions } from '@/views/ParticipantPredictions';

export const Route = createFileRoute('/_app/participants/$name')({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = useParams({ from: '/_app/participants/$name' });
  const { data: matches, isPending: matchesPending, error: matchesError } = useMatches();
  const {
    data: participant,
    isPending: participantPending,
    error: participantError,
  } = useParticipant(name);
  const {
    data: predictions,
    isPending: predictionsPending,
    error: predictionsError,
  } = usePredictions({
    participant: name,
  });

  const isPending = matchesPending || participantPending || predictionsPending;
  const error = matchesError || participantError || predictionsError;
  const loaded = matches && participant && predictions;

  if (isPending || !loaded) {
    return <Spinner className="size-16" />;
  }

  if (error) {
    return <ErrorCard error={error} />;
  }

  const { winner, runnerUp, thirdPlace, fourthPlace, topScorer, scorerNationality } =
    participant.tournamentPredictions;

  return (
    <div className="flex h-full min-h-0 flex-col">
      <PageTitle>{participant.name}</PageTitle>
      <Tabs defaultValue="results" className="flex min-h-0 flex-1 flex-col min-w-3xl">
        <TabsList>
          <TabsTrigger value="results">Results</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>
        <TabsContent value="results" className="min-h-0 flex-1 overflow-y-auto">
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
          {matches && <MatchesList matches={matches} predictions={predictions} />}
        </TabsContent>
        <TabsContent value="predictions" className="min-h-0 flex-1 overflow-y-auto">
          <ParticipantPredictions />
        </TabsContent>
      </Tabs>
      {/* <RouterButton to="/participants/$name/predictions" params={{ name }}>
        Submit predictions
      </RouterButton> */}
    </div>
  );
}
