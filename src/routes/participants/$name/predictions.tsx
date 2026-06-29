import { createFileRoute, useParams } from '@tanstack/react-router';
import { isAfter } from 'date-fns';
import { useState } from 'react';
import { type ParticipantPrediction, saveParticipantPredictions } from '@/api/generated';
import { useMatches, usePredictions } from '@/api/hooks';
import { ErrorCard } from '@/components/ErrorCard';
import { FlagDisplay } from '@/components/FlagDisplay';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export const Route = createFileRoute('/participants/$name/predictions')({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = useParams({ from: '/participants/$name/predictions' });
  const { data: matches, isPending: matchesPending, error: matchesError } = useMatches();
  const {
    data: predictions,
    isPending: predictionsPending,
    error: predictionsError,
  } = usePredictions({
    participant: name,
  });

  type PredictionDraft = Omit<ParticipantPrediction, 'matchId'>;
  const [predictionsByMatchId, setPredictionsByMatchId] = useState<Record<number, PredictionDraft>>(
    {},
  );

  const isPending = matchesPending || predictionsPending;
  const error = matchesError || predictionsError;
  const loaded = matches && predictions;

  if (isPending || !loaded) {
    return <Spinner className="size-16" />;
  }

  if (error) {
    return <ErrorCard error={error} />;
  }

  const now = new Date();

  const futureMatches = matches.filter(m => {
    const d = new Date(m.date);
    return isAfter(d, now);
  });

  const handleSubmitPrediction = () => {
    const payload = Object.entries(predictionsByMatchId).map(([matchId, p]) => ({
      matchId: Number(matchId),
      ...p,
    }));
    saveParticipantPredictions(name, payload);
  };

  const updatePrediction = (matchId: number, updates: Partial<ParticipantPrediction>) => {
    setPredictionsByMatchId(prev => ({
      ...prev,
      [matchId]: {
        matchId,
        ...prev[matchId],
        ...updates,
      },
    }));
  };

  // TODO style this and update predictions with actual ones
  return (
    <>
      <Button onClick={handleSubmitPrediction}>Submit</Button>
      {futureMatches.map(fm => {
        let pred = predictionsByMatchId[fm.id];
        let existing = false;
        if (pred === undefined) {
          const p = predictions.find(p => p.id === fm.id);
          if (p !== undefined) {
            pred = {
              homeScore: p.homeScore,
              awayScore: p.awayScore,
              playedJoker: p.usedJoker,
            };
            existing = true;
          }
        }
        if (pred === undefined) {
          pred = {
            homeScore: 0,
            awayScore: 0,
          };
        }
        return (
          <FieldGroup key={fm.id}>
            <div className="flex gap-2">
              <Field>
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
                  value={existing ? pred.homeScore : undefined}
                />
              </Field>
              <Field>
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
                  value={existing ? pred.awayScore : undefined}
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
                  checked={pred.playedJoker}
                />
                <Label htmlFor="joker">Play Joker</Label>
              </Field>
            </div>
          </FieldGroup>
        );
      })}
    </>
  );
}
