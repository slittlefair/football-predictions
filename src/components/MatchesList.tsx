import classNames from 'classnames';
import { differenceInSeconds } from 'date-fns';
import { useEffect, useState } from 'react';
import type { Match, Participant } from '@/api/generated';
import { FlagDisplay } from '@/components/FlagDisplay';
import { RouterButton } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow as TRow } from '@/components/ui/table';
import { formatDate } from '@/utils/date';

export const MatchesList = ({
  matches,
  participant,
  missingPredictions,
}: {
  matches: Match[];
  participant?: Participant;
  missingPredictions?: Record<number, string[]>;
}) => {
  let currentDateString = '';
  let matchBucket: Match[] = [];
  // TODO fix bug where final doesn't show byt 3/4 place shows twice
  const matchSections = matches.reduce<Match[][]>((acc, m, i) => {
    const { date } = formatDate(m.date);
    if (i === matches.length - 1) {
      acc.push(matchBucket);
    }
    if (date === currentDateString) {
      matchBucket.push(m);
      return acc;
    }
    if (matchBucket.length > 0) {
      acc.push(matchBucket);
    }

    matchBucket = [m];
    currentDateString = date;
    return acc;
  }, []);

  const now = new Date();
  let nextMatchId = 0;
  for (const m of matches) {
    if (new Date(m.date) > now) {
      nextMatchId = m.id;
      break;
    }
  }

  return matchSections.map(sec => {
    const { date } = formatDate(sec[0].date);
    return (
      <div key={date} className="p-3">
        <h3 className="font-bold mb-2">{date}</h3>
        <Table className="w-4xl">
          <TableBody>
            {sec.map(match => {
              const tableRow = (
                <TableRow
                  key={match.id}
                  match={match}
                  showCountdown={match.id === nextMatchId}
                  participant={participant}
                />
              );
              if (!missingPredictions) {
                return tableRow;
              }
              const missingPreds = missingPredictions[match.id];
              return (
                <>
                  {tableRow}
                  {missingPreds.length > 0 && (
                    <TRow>
                      <TableCell colSpan={5} className="pl-3 text-red-600 font-bold">
                        Missing Predictions: {missingPreds.join(', ')}
                      </TableCell>
                    </TRow>
                  )}
                </>
              );
            })}
          </TableBody>
        </Table>
      </div>
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
  // const endOfTomorrow = endOfDay(addDays(now, 1));

  // const secondsUntilEndOfTomorrow = differenceInSeconds(endOfTomorrow, now);

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

const TableRow = ({
  match,
  showCountdown,
  participant,
}: {
  match: Match;
  showCountdown: boolean;
  participant?: Participant;
}) => {
  // const { data } = useGetParticipants();
  const { time } = formatDate(match.date);
  const prediction = participant?.predictions.find(p => p.id === match.id);
  const havePrediction = prediction?.homeScore !== undefined && prediction?.awayScore !== undefined;

  // const missingPreds = [];
  // if (seconds < secondsUntilEndOfTomorrow && data?.data) {
  //   for (const p of data.data) {
  //     const m = p.predictions.find(p => p.id === match.id);
  //     if (!m) {
  //       continue;
  //     }
  //     if (m.homeScore === undefined || m.awayScore === undefined) {
  //       missingPreds.push(p.name);
  //     }
  //   }
  // }

  return (
    <TRow
      key={match.id}
      className={classNames(
        prediction && {
          'bg-red-400': match.hasResult && prediction.points === 0,
          'bg-yellow-400': match.hasResult && prediction.points > 0 && prediction.points < 3,
          'bg-emerald-400': match.hasResult && prediction.points > 2,
        },
      )}
    >
      <TableCell className="w-24">{match.round}</TableCell>
      <TableCell className="w-40">
        <div className="flex justify-end items-center w-full">
          <FlagDisplay displayName={match.homeTeam} />
        </div>
      </TableCell>

      <TableCell className="w-12 text-center">
        {match.hasResult ? `${match.homeScore} - ${match.awayScore}` : time}
      </TableCell>

      <TableCell className="w-40">
        <div className="flex justify-start items-center w-full">
          <FlagDisplay displayName={match.awayTeam} flagPosition="left" />
        </div>
      </TableCell>

      {prediction && (
        <TableCell className="w-36">
          {havePrediction && `${prediction.homeScore} - ${prediction.awayScore}`}
          {'  '}
          {havePrediction && match.hasResult && `(${prediction.points} points)`}
        </TableCell>
      )}

      <TableCell className="w-20">{showCountdown && <Countdown date={match.date} />}</TableCell>
      {/* <TableCell className="w-24 text-red-600 font-bold">
        {missingPreds.length > 0 && (
          <>
            Missing:
            <ul className="list-disc">
              {missingPreds.map(mp => (
                <li key={mp}>{mp}</li>
              ))}
            </ul>
          </>
        )}
      </TableCell> */}
      <TableCell>
        <RouterButton to="/matches/$id" params={{ id: String(match.id) }}>
          View
        </RouterButton>
      </TableCell>
    </TRow>
  );
};

const renderCountdown = (s: number) => {
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  return [hours, minutes, seconds].map(n => n.toString().padStart(2, '0')).join(':');
};
