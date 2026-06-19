import { createFileRoute, useParams } from '@tanstack/react-router';
import { useState } from 'react';
import {
  type Match,
  type ParticipantPrediction,
  type Prediction,
  saveParticipantPredictions,
} from '@/api/generated';
import { useMatches, useParticipant, usePredictions } from '@/api/hooks';
import { ErrorCard } from '@/components/ErrorCard';
import { FlagCell, FlagDisplay } from '@/components/FlagDisplay';
import { MatchesList } from '@/components/MatchesList';
import { Button, RouterButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { PageTitle } from '@/components/ui/pageTitle';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/participants/$name/')({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = useParams({ from: '/participants/$name/' });
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
    <div>
      <PageTitle>{participant.name}</PageTitle>
      <RouterButton to="/participants/$name/predictions" params={{ name }}>
        Submit predictions
      </RouterButton>
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
    </div>
  );
}

const FormDialog = ({
  futureMatches,
  predictions,
}: {
  futureMatches: Match[];
  predictions: Prediction[];
}) => {
  const { name } = useParams({ from: '/participants/$name/' });

  const [predictionsByMatchId, setPredictionsByMatchId] = useState<
    Record<number, ParticipantPrediction>
  >({});

  const handleSubmitPrediction = (e: React.SubmitEvent) => {
    e.preventDefault();

    saveParticipantPredictions(name, Object.values(predictionsByMatchId));
  };

  const updatePrediction = (matchId: number, updates: Partial<ParticipantPrediction>) => {
    setPredictionsByMatchId(prev => ({
      ...prev,
      [matchId]: {
        id: matchId,
        ...prev[matchId],
        ...updates,
      },
    }));
  };

  return (
    <Dialog>
      <DialogTrigger render={<Button>Add prediction</Button>} />
      <DialogContent>
        <form onSubmit={handleSubmitPrediction}>
          <DialogHeader>
            <DialogTitle>Add prediction</DialogTitle>
            <DialogDescription>Some description here</DialogDescription>
          </DialogHeader>
          {futureMatches.map(fm => {
            let pred = predictionsByMatchId[fm.id] || predictions.find(p => p.id === fm.id);
            if (pred === undefined) {
              pred = {
                matchId: fm.id,
                homeScore: 0,
                awayScore: 0,
              };
            }
            return (
              <FieldGroup key={fm.id}>
                <Field orientation={'horizontal'}>
                  <Label htmlFor="homeScore">
                    <FlagDisplay displayName={fm.homeTeam} />
                  </Label>
                  <Input
                    id="homeScore"
                    type="number"
                    min="0"
                    aria-invalid={pred.homeScore < 0}
                    onChange={e =>
                      updatePrediction(fm.id, {
                        homeScore: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field orientation={'horizontal'}>
                  <Label htmlFor="awayScore">
                    <FlagDisplay displayName={fm.awayTeam} />
                  </Label>
                  <Input
                    id="awayScore"
                    type="number"
                    min="0"
                    aria-invalid={pred.awayScore < 0}
                    onChange={e =>
                      updatePrediction(fm.id, {
                        awayScore: Number(e.target.value),
                      })
                    }
                  />
                </Field>
                <Field orientation="horizontal">
                  <Checkbox
                    id="joker"
                    name="joker"
                    onCheckedChange={e =>
                      updatePrediction(fm.id, {
                        playedJoker: e,
                      })
                    }
                  />
                  <Label htmlFor="joker">Play Joker</Label>
                </Field>
              </FieldGroup>
            );
          })}
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={Object.keys(predictionsByMatchId).length === 0}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
