import { useQueryClient } from '@tanstack/react-query';
import { useNavigate } from '@tanstack/react-router';
import classNames from 'classnames';
import { differenceInSeconds, isBefore } from 'date-fns';
import {
  type ComponentProps,
  type ForwardedRef,
  Fragment,
  forwardRef,
  useEffect,
  useRef,
  useState,
} from 'react';
import {
  getGetPredictionsQueryKey,
  type Match,
  type Prediction,
  useSaveParticipantPredictions,
} from '@/api/generated';
import Joker from '@/assets/joker.svg';
import { FlagDisplay } from '@/components/FlagDisplay';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Field, FieldGroup } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableRow as TRow } from '@/components/ui/table';
import { formatDate } from '@/utils/date';

type PredictionEdit = Partial<Pick<Prediction, 'homeScore' | 'awayScore' | 'joker'>>;

export const MatchesList = ({
  matches,
  predictions,
  missingPredictions,
}: {
  matches: Match[];
  predictions?: Prediction[];
  missingPredictions?: Record<number, string[]>;
}) => {
  const ref = useRef<HTMLTableRowElement | null>(null);
  const queryClient = useQueryClient();
  const [predictionEdits, setPredictionEdits] = useState<Record<number, PredictionEdit>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<null | Date>(null);
  const participant = predictions ? predictions[0].participant : '';

  let currentDateString = '';
  let matchBucket: Match[] = [];
  const matchSections = matches.reduce<Match[][]>((acc, m, i) => {
    const { date } = formatDate(m.date);

    if (date === currentDateString) {
      matchBucket.push(m);
      if (i === matches.length - 1) {
        acc.push(matchBucket);
      }
      return acc;
    }

    if (matchBucket.length > 0) {
      acc.push(matchBucket);
    }

    matchBucket = [m];
    currentDateString = date;
    if (i === matches.length - 1) {
      acc.push(matchBucket);
    }
    return acc;
  }, []);

  const now = new Date();
  let upcomingMatchId = 0;
  let nextMatchId = 0;
  for (let i = 0; i < matches.length; i++) {
    const m = matches[i];
    if (!m.hasResult) {
      nextMatchId = m.id;
      if (new Date(m.date) > now) {
        upcomingMatchId = m.id;
      } else if (i !== matches.length - 1) {
        upcomingMatchId = matches[i + 1].id;
      }
      break;
    }
  }

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

  useEffect(() => {
    if (ref?.current) {
      ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  return matchSections.map(sec => {
    const { date } = formatDate(sec[0].date);
    return (
      <Card key={date} className="not-first:mt-4 max-w-3xl">
        <h3 className="font-bold">{date}</h3>
        <Table>
          <TableBody>
            {sec.map(match => {
              const tableRow = (
                <TableRow
                  key={match.id}
                  match={match}
                  showCountdown={match.id === upcomingMatchId}
                  prediction={predictions?.find(p => p.id === match.id)}
                  predictionEdit={predictionEdits[match.id]}
                  ref={match.id === nextMatchId ? ref : undefined}
                  updatePrediction={updatePrediction}
                  allowEnterPrediction={!missingPredictions}
                />
              );
              if (!missingPredictions) {
                return tableRow;
              }
              const missingPreds = missingPredictions[match.id];
              return (
                <Fragment key={`match-container-${match.id}`}>
                  {tableRow}
                  {missingPreds.length > 0 && (
                    <TRow>
                      <TableCell
                        colSpan={100}
                        className="pl-3 text-red-600 font-bold hover:bg-white"
                      >
                        Missing Predictions: {missingPreds.join(', ')}
                      </TableCell>
                    </TRow>
                  )}
                </Fragment>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    );
  });
};

const Countdown = ({ date }: { date: string }) => {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const seconds = Math.max(0, differenceInSeconds(new Date(date), now));

  return (
    <div
      className={classNames({
        'text-red-600 font-bold': seconds < 3600,
      })}
    >
      {renderCountdown(seconds)}
    </div>
  );
};

const TableRow = forwardRef(
  (
    {
      match,
      showCountdown,
      prediction,
      predictionEdit,
      updatePrediction,
      allowEnterPrediction,
    }: {
      match: Match;
      showCountdown: boolean;
      prediction?: Prediction;
      predictionEdit?: PredictionEdit;
      updatePrediction: (matchId: number, updates: PredictionEdit) => void;
      allowEnterPrediction: boolean;
    },
    ref: ForwardedRef<HTMLTableRowElement>,
  ) => {
    const { time } = formatDate(match.date);
    const havePrediction =
      prediction?.homeScore !== undefined && prediction?.awayScore !== undefined;
    const navigate = useNavigate();
    const onCellClick = () => navigate({ to: '/matches/$id', params: { id: String(match.id) } });

    const p = {
      ...prediction,
      ...predictionEdit,
    };

    return (
      <TRow
        key={match.id}
        className={classNames(
          'group',
          prediction && {
            'bg-red-400 hover:bg-red-500': match.hasResult && prediction.points === 0,
            'bg-yellow-400 hover:bg-yellow-500':
              match.hasResult && prediction.points > 0 && prediction.points < 3,
            'bg-emerald-400 hover:bg-emerald-500': match.hasResult && prediction.points > 2,
          },
        )}
        ref={ref}
      >
        <TableCell className="w-24">{match.round}</TableCell>
        <ClickableCell onClick={onCellClick} className="w-40">
          <div className="flex justify-end items-center w-full hover:font-bold">
            <FlagDisplay displayName={match.homeTeam} />
          </div>
        </ClickableCell>
        <ClickableCell onClick={onCellClick} className="w-12 text-center">
          {match.hasResult ? `${match.homeScore} - ${match.awayScore}` : time}
        </ClickableCell>
        <ClickableCell onClick={onCellClick} className="w-40">
          <div className="flex justify-start items-center w-full">
            <FlagDisplay displayName={match.awayTeam} flagPosition="left" />
          </div>
        </ClickableCell>
        <TableCell className="w-28">
          {isBefore(new Date(match.date), new Date()) ? (
            prediction ? (
              <>
                {havePrediction && `${prediction.homeScore} - ${prediction.awayScore}`}
                {'  '}
                {havePrediction && match.hasResult && `(${prediction.points} points)`}
              </>
            ) : null
          ) : allowEnterPrediction ? (
            <EnterPrediction id={match.id} prediction={p} updatePrediction={updatePrediction} />
          ) : null}
        </TableCell>
        <TableCell className="w-10">
          {prediction?.joker && <img src={Joker} alt="Joker" className="h-6" />}
        </TableCell>
        <TableCell className="w-20">{showCountdown && <Countdown date={match.date} />}</TableCell>
      </TRow>
    );
  },
);

const ClickableCell = ({ className, onClick, children, ...props }: ComponentProps<'td'>) => (
  <TableCell
    {...props}
    onClick={onClick}
    className={classNames(
      className,
      'clickable-cell cursor-pointer group-has-[.clickable-cell:hover]:font-bold group-has-[.clickable-cell:hover]:underline group-has-[.clickable-cell:hover]:decoration-2 group-has-[.clickable-cell:hover]:underline-offset-2',
    )}
  >
    {children}
  </TableCell>
);

const renderCountdown = (s: number) => {
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  return [hours, minutes, seconds].map(n => n.toString().padStart(2, '0')).join(':');
};

const EnterPrediction = ({
  id,
  prediction,
  updatePrediction,
}: {
  id: number;
  prediction: PredictionEdit;
  updatePrediction: (matchId: number, updates: PredictionEdit) => void;
}) => {
  return (
    <FieldGroup key={id}>
      <div className="flex gap-2 mt-2">
        <Field orientation="horizontal" className="flex">
          <Input
            id={`${id}-homeScore`}
            type="number"
            min="0"
            aria-invalid={(prediction.homeScore || 0) < 0}
            onChange={e =>
              updatePrediction(id, {
                homeScore: e.target.value === '' ? undefined : Number(e.target.value),
                awayScore: prediction.awayScore,
                joker: prediction.joker,
              })
            }
            value={prediction.homeScore ?? ''}
            className="w-12"
          />
        </Field>
        <Field orientation="horizontal">
          <Input
            id={`${id}-awayScore`}
            type="number"
            min="0"
            aria-invalid={(prediction.awayScore || 0) < 0}
            onChange={e =>
              updatePrediction(id, {
                homeScore: prediction.homeScore,
                awayScore: e.target.value === '' ? undefined : Number(e.target.value),
                joker: prediction.joker,
              })
            }
            value={prediction.awayScore ?? ''}
            className="w-12"
          />
        </Field>
        <Field orientation="horizontal">
          <Checkbox
            id="joker"
            name="joker"
            onCheckedChange={checked =>
              updatePrediction(id, {
                homeScore: prediction.homeScore,
                awayScore: prediction.awayScore,
                joker: checked,
              })
            }
            checked={prediction.joker ?? false}
          />
          <Label htmlFor="joker">
            <img src={Joker} alt="Joker" className="h-6" />
          </Label>
        </Field>
      </div>
    </FieldGroup>
  );
};
