import { useQueryClient } from '@tanstack/react-query';
import { useParams } from '@tanstack/react-router';
import { isAfter } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import {
  getGetPredictionsQueryKey,
  type Prediction,
  useSaveParticipantPredictions,
} from '@/api/generated';
import { useMatches, usePredictions } from '@/api/hooks';
import { ErrorCard } from '@/components/ErrorCard';
import { FlagDisplay } from '@/components/FlagDisplay';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Spinner } from '@/components/ui/spinner';

export const ParticipantPredictions = () => {
  const { name: participant } = useParams({ from: '/_app/participants/$name' });
  const { data: matches, isPending: matchesPending, error: matchesError } = useMatches();
  const {
    data,
    isPending: predictionsPending,
    error: predictionsError,
  } = usePredictions({
    participant,
  });

  const queryClient = useQueryClient();

  const predictions = useMemo(
    () =>
      data?.reduce<Record<number, Prediction>>((acc, p) => {
        acc[p.id] = p;
        return acc;
      }, {}),
    [data],
  );

  type PredictionEdit = Partial<Pick<Prediction, 'homeScore' | 'awayScore' | 'joker'>>;

  const [predictionEdits, setPredictionEdits] = useState<Record<number, PredictionEdit>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<null | Date>(null);

  const { mutate: saveParticipantPredictions, isPending: savingPending } =
    useSaveParticipantPredictions({
      mutation: {
        onSuccess: async () => {
          await queryClient.invalidateQueries({
            queryKey: getGetPredictionsQueryKey({ participant }),
          });
          setHasUnsavedChanges(false);
          setLastSavedAt(new Date());
        },
      },
    });

  const isPending = matchesPending || predictionsPending;
  const error = matchesError || predictionsError;
  const loaded = matches && predictions;

  useEffect(() => {
    if (Object.keys(predictionEdits).length === 0) {
      return;
    }

    const timeout = setTimeout(() => {
      const payload = Object.entries(predictionEdits).map(([matchId, p]) => ({
        matchId: Number(matchId),
        ...p,
      }));

      saveParticipantPredictions({
        participant,
        data: payload,
      });
    }, 500);

    return () => clearTimeout(timeout);
  }, [predictionEdits, participant, saveParticipantPredictions]);

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

  const updatePrediction = (matchId: number, updates: PredictionEdit) => {
    setHasUnsavedChanges(true);
    setPredictionEdits(prev => {
      return {
        ...prev,
        [matchId]: {
          ...prev[matchId],
          ...updates,
        },
      };
    });
  };

  // TODO style this and update predictions with actual ones
  return (
    <>
      <p>
        {savingPending
          ? 'Saving...'
          : hasUnsavedChanges
            ? 'Waiting to save...'
            : lastSavedAt
              ? `Saved at ${lastSavedAt.toLocaleTimeString()}`
              : ''}
      </p>
      {futureMatches.map(fm => {
        const prediction = {
          ...predictions[fm.id],
          ...predictionEdits[fm.id],
        };
        return (
          <FieldGroup key={fm.id}>
            <div className="flex gap-2 mt-2">
              <Field orientation="horizontal" className="flex">
                <Label htmlFor={`${fm.id}-homeScore`} className="w-full flex justify-end">
                  <FlagDisplay displayName={fm.homeTeam} />
                </Label>
                <Input
                  id={`${fm.id}-homeScore`}
                  type="number"
                  min="0"
                  aria-invalid={(prediction.homeScore || 0) < 0}
                  onChange={e =>
                    updatePrediction(fm.id, {
                      homeScore: e.target.value === '' ? undefined : Number(e.target.value),
                      awayScore: prediction.awayScore,
                      joker: prediction.joker,
                    })
                  }
                  value={prediction.homeScore ?? ''}
                  className="w-20"
                />
              </Field>
              <Field orientation="horizontal">
                <Input
                  id={`${fm.id}-awayScore`}
                  type="number"
                  min="0"
                  aria-invalid={(prediction.awayScore || 0) < 0}
                  onChange={e =>
                    updatePrediction(fm.id, {
                      homeScore: prediction.homeScore,
                      awayScore: e.target.value === '' ? undefined : Number(e.target.value),
                      joker: prediction.joker,
                    })
                  }
                  value={prediction.awayScore ?? ''}
                  className="w-20"
                />
                <Label htmlFor={`${fm.id}-awayScore`} className="w-full">
                  <FlagDisplay displayName={fm.awayTeam} flagPosition="left" />
                </Label>
              </Field>
              <Field orientation="horizontal">
                <Checkbox
                  id="joker"
                  name="joker"
                  onCheckedChange={checked =>
                    updatePrediction(fm.id, {
                      homeScore: prediction.homeScore,
                      awayScore: prediction.awayScore,
                      joker: checked,
                    })
                  }
                  checked={prediction.joker ?? false}
                />
                <Label htmlFor="joker">Play Joker</Label>
              </Field>
            </div>
          </FieldGroup>
        );
      })}
    </>
  );
};
