import { faChevronLeft, faChevronRight, faWarning } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createFileRoute, useParams } from '@tanstack/react-router';
import classNames from 'classnames';
import { type ReactNode, useState } from 'react';
import { createPrediction, type Match, type Prediction } from '@/api/generated';
import { useMatches, useParticipants, usePredictions } from '@/api/hooks';
import Joker from '@/assets/joker.svg';
import { ErrorCard } from '@/components/ErrorCard';
import { FlagDisplay } from '@/components/FlagDisplay';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/date';

export const Route = createFileRoute('/matches/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: '/matches/$id' });
  const { data: matches, isPending: matchesPending, error: matchesError } = useMatches();
  const {
    data: predictions,
    isPending: predictionsPending,
    error: predictionsError,
  } = usePredictions({ matchId: Number(id) });
  const {
    data: participants,
    isPending: participantsPending,
    error: participantsError,
  } = useParticipants();

  const error = matchesError || predictionsError || participantsError;
  if (error) {
    return <ErrorCard error={error} />;
  }

  const isPending = matchesPending || predictionsPending || participantsPending;
  if (isPending || !matches) {
    return (
      <>
        <div className="flex flex-col items-center w-full">
          <div className="flex w-full mb-2">
            <Button disabled variant="secondary" className="font-bold">
              <Spinner data-icon="inline-start" />
              Loading...
            </Button>
            <Button disabled variant="secondary" className="ml-auto font-bold">
              Loading...
              <Spinner data-icon="inline-end" />
            </Button>
          </div>
        </div>
        <Card className="flex flex-col items-center gap-2 p-4 min-w-120 h-91.5 justify-center">
          <Spinner className="size-14" />
        </Card>
      </>
    );
  }

  const matchIdx = matches?.findIndex(m => m.id === Number(id));
  if (matchIdx === -1) {
    return <ErrorCard error={new Error('match not found')} />;
  }

  const match = matches[matchIdx];
  const previousMatch = matchIdx !== 0 ? matches[matchIdx - 1] : undefined;
  const nextMatch = matchIdx !== matches.length ? matches[matchIdx + 1] : undefined;

  const participantNames = participants?.map(p => p.name);

  const missingPredictions = participantNames?.filter(
    pn => !predictions?.find(p => p.participant === pn),
  );

  const isCompletePrediction = (
    prediction: Prediction,
  ): prediction is Prediction & { homeScore: number; awayScore: number } => {
    return prediction.homeScore !== undefined && prediction.awayScore !== undefined;
  };

  const sortedPredictions = predictions?.sort((a, b) => {
    // If we have points, order by who scored the most
    if (a.points !== b.points) {
      return b.points - a.points;
    }

    // If the match has finished, we'll sort by points and then name
    if (a.hasResult && b.hasResult) {
      return a.participant.localeCompare(b.participant);
    }

    // If a prediction is incomplete, place it at the bottom
    if (!isCompletePrediction(a) && !isCompletePrediction(b)) {
      return a.participant.localeCompare(b.participant);
    }
    if (!isCompletePrediction(a)) {
      return 1;
    }
    if (!isCompletePrediction(b)) {
      return -1;
    }

    const aDiff = a.homeScore - a.awayScore;
    const bDiff = b.homeScore - b.awayScore;

    if (aDiff !== bDiff) {
      return bDiff - aDiff;
    }

    if (a.homeScore !== b.homeScore) {
      return b.homeScore - a.homeScore;
    }

    return a.participant.localeCompare(b.participant);
  });

  const { date, time } = formatDate(match.date);

  return (
    <div className="flex flex-col items-center w-full">
      {(nextMatch || previousMatch) && (
        <div className="flex w-full mb-2">
          <NavButton
            match={previousMatch}
            className="font-bold"
            leftIcon={<FontAwesomeIcon icon={faChevronLeft} />}
          />
          <NavButton
            match={nextMatch}
            className="ml-auto font-bold"
            rightIcon={<FontAwesomeIcon icon={faChevronRight} />}
          />
        </div>
      )}
      <Card className="flex flex-col items-center gap-2 p-4 min-w-120">
        <h3 className="scroll-m-20 text-lg font-semibold tracking-tight">
          {date} <span className="text-lg">●</span> {match.round}
        </h3>
        <div className="grid grid-cols-[1fr_auto_1fr] gap-x-4 items-center font-bold text-lg">
          <div className="flex justify-end">
            <FlagDisplay displayName={match.homeTeam} />
          </div>
          <div>
            <p className="font-bold text-2xl">
              {match.hasResult ? `${match.homeScore} - ${match.awayScore}` : time}
            </p>
          </div>
          <div className="flex justify-start">
            <FlagDisplay displayName={match.awayTeam} flagPosition="left" />
          </div>
        </div>

        {sortedPredictions && missingPredictions ? (
          <Table className="w-fit m-auto">
            <TableBody>
              {sortedPredictions.map(p => {
                const state = !match.hasResult
                  ? 'none'
                  : p.points === 0
                    ? 'red'
                    : p.points < 3
                      ? 'orange'
                      : 'green';
                return (
                  <TableRow
                    key={p.participant}
                    className={classNames(
                      {
                        'bg-red-400 hover:bg-red-400': state === 'red',
                        'bg-amber-300 hover:bg-amber-300': state === 'orange',
                        'bg-emerald-500 hover:bg-emerald-500': state === 'green',
                      },
                      'border-neutral-700',
                    )}
                  >
                    <TableCell className="w-18 pl-4">{p.participant}</TableCell>
                    <TableCell className="w-12 py-0 pl-0">
                      <div className="flex justify-left">
                        {p.joker && <img src={Joker} alt="joker" className="h-6" />}
                      </div>
                    </TableCell>
                    <TableCell className="w-18 text-center">
                      {p.homeScore !== undefined && p.awayScore !== undefined
                        ? `${p.homeScore} - ${p.awayScore}`
                        : '-'}
                    </TableCell>
                    {match.hasResult && (
                      <TableCell className="w-12 text-center">{p.points}</TableCell>
                    )}
                  </TableRow>
                );
              })}
              {missingPredictions.map(p => (
                <TableRow
                  key={p}
                  className={classNames(
                    {
                      'bg-red-400 hover:bg-red-400': match.hasResult,
                    },
                    'border-neutral-700',
                  )}
                >
                  <TableCell className="w-18 pl-4">{p}</TableCell>
                  <TableCell className="w-12 py-0 pl-0" />
                  <TableCell className="w-18 text-center">
                    <FontAwesomeIcon className="text-red-600" icon={faWarning} />
                  </TableCell>
                  {match.hasResult && <TableCell className="w-12 text-center">0</TableCell>}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <Spinner className="size-16" />
        )}
        <FormDialog match={match} missingPredictions={missingPredictions} />
      </Card>
    </div>
  );
}

const FormDialog = ({
  missingPredictions,
  match,
}: {
  missingPredictions?: string[];
  match: Match;
}) => {
  const { id } = useParams({ from: '/matches/$id' });
  const [participant, setParticipant] = useState<string | null>('');
  const [homeScore, setHomeScore] = useState<string>();
  const [awayScore, setAwayScore] = useState<string>();
  const [joker, setjoker] = useState(false);

  if (match.hasResult || !missingPredictions || missingPredictions.length === 0) {
    return null;
  }

  const handleSubmitPrediction = (e: React.SubmitEvent) => {
    e.preventDefault();

    createPrediction({
      matchId: Number(id),
      homeScore: Number(homeScore),
      awayScore: Number(awayScore),
      joker,
    });
  };

  const formValid = !!participant && Number(homeScore) >= 0 && Number(awayScore) >= 0;

  return (
    <Dialog>
      <DialogTrigger render={<Button>Add prediction</Button>} />
      <DialogContent>
        <form onSubmit={handleSubmitPrediction}>
          <DialogHeader>
            <DialogTitle>Add prediction</DialogTitle>
            <DialogDescription>Some description here</DialogDescription>
          </DialogHeader>
          <FieldGroup>
            <Field>
              <Label htmlFor="participant">Participant</Label>
              <Select id="participant" onValueChange={setParticipant}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a participant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {missingPredictions?.map(p => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
            <div className="flex gap-4">
              <Field>
                <Label htmlFor="homeScore">
                  <FlagDisplay displayName={match.homeTeam} />
                </Label>
                <Input
                  id="homeScore"
                  type="number"
                  min="0"
                  aria-invalid={Number(homeScore) < 0}
                  onChange={e => setHomeScore(e.target.value)}
                />
              </Field>
              <Field>
                <Label htmlFor="awayScore">
                  <FlagDisplay displayName={match.awayTeam} />
                </Label>
                <Input id="awayScore" type="number" onChange={e => setAwayScore(e.target.value)} />
              </Field>
            </div>
            <Field orientation="horizontal">
              <Checkbox id="joker" name="joker" onCheckedChange={e => setjoker(e)} />
              <Label htmlFor="joker">Play Joker</Label>
            </Field>
          </FieldGroup>
          <DialogFooter>
            <DialogClose render={<Button variant="outline">Cancel</Button>} />
            <Button type="submit" disabled={!formValid}>
              Save
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const NavButton = ({
  match,
  className,
  leftIcon,
  rightIcon,
}: {
  match?: Match;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}) => {
  if (!match) {
    return null;
  }
  return (
    <RouterButton to="/matches/$id" params={{ id: String(match.id) }} className={className}>
      {leftIcon}
      {match.homeTeam} v {match.awayTeam}
      {rightIcon}
    </RouterButton>
  );
};
