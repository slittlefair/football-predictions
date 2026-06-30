import { useNavigate } from '@tanstack/react-router';
import classNames from 'classnames';
import { differenceInSeconds } from 'date-fns';
import { Fragment, useEffect, useState } from 'react';
import type { Match, Prediction } from '@/api/generated';
import Joker from '@/assets/joker.svg';
import { FlagDisplay } from '@/components/FlagDisplay';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableRow as TRow } from '@/components/ui/table';
import { formatDate } from '@/utils/date';

export const MatchesList = ({
  matches,
  predictions,
  missingPredictions,
}: {
  matches: Match[];
  predictions?: Prediction[];
  missingPredictions?: Record<number, string[]>;
}) => {
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
      <Card key={date} className="not-first:mt-4 max-w-3xl">
        <h3 className="font-bold">{date}</h3>
        <Table>
          <TableBody>
            {sec.map(match => {
              const tableRow = (
                <TableRow
                  key={match.id}
                  match={match}
                  showCountdown={match.id === nextMatchId}
                  prediction={predictions?.find(p => p.id === match.id)}
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

const TableRow = ({
  match,
  showCountdown,
  prediction,
}: {
  match: Match;
  showCountdown: boolean;
  prediction?: Prediction;
}) => {
  const { time } = formatDate(match.date);
  const havePrediction = prediction?.homeScore !== undefined && prediction?.awayScore !== undefined;
  const navigate = useNavigate();

  return (
    <TRow
      key={match.id}
      className={classNames(
        'cursor-pointer',
        prediction && {
          'bg-red-400 hover:bg-red-500': match.hasResult && prediction.points === 0,
          'bg-yellow-400 hover:bg-yellow-500':
            match.hasResult && prediction.points > 0 && prediction.points < 3,
          'bg-emerald-400 hover:bg-emerald-500': match.hasResult && prediction.points > 2,
        },
      )}
      onClick={() => navigate({ to: '/matches/$id', params: { id: String(match.id) } })}
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
        <TableCell className="w-28">
          {havePrediction && `${prediction.homeScore} - ${prediction.awayScore}`}
          {'  '}
          {havePrediction && match.hasResult && `(${prediction.points} points)`}
        </TableCell>
      )}
      <TableCell className="w-10">
        {prediction?.joker && <img src={Joker} alt="Joker" className="h-6" />}
      </TableCell>
      <TableCell className="w-20">{showCountdown && <Countdown date={match.date} />}</TableCell>
    </TRow>
  );
};

const renderCountdown = (s: number) => {
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;

  return [hours, minutes, seconds].map(n => n.toString().padStart(2, '0')).join(':');
};
