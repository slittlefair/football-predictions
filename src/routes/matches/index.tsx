import { createFileRoute } from '@tanstack/react-router';
import classNames from 'classnames';
import { differenceInSeconds } from 'date-fns';
import { useEffect, useState } from 'react';
import { type Match, useGetMatches, useGetParticipants } from '@/api/generated';
import { FlagDisplay } from '@/components/FlagDisplay';
import { RouterButton } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow as TRow } from '@/components/ui/table';
import { formatDate } from '@/utils/date';

const RouteComponent = () => {
  const { data, isLoading, error } = useGetMatches();
  const {
    data: participantsResp,
    isLoading: partsLoading,
    error: partsError,
  } = useGetParticipants();

  if (error || partsError) {
    return <p>Something went wrong</p>;
  }

  if (isLoading || !data || partsLoading || !participantsResp) {
    return <p>Loading...</p>;
  }

  let currentDateString = '';
  let matchBucket: Match[] = [];
  const matchSections = data.data.reduce<Match[][]>((acc, m) => {
    const { date } = formatDate(m.date);
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
  for (const m of data.data) {
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
            {sec.map(match => (
              <TableRow key={match.id} match={match} showCountdown={match.id === nextMatchId} />
            ))}
          </TableBody>
        </Table>
      </div>
    );
  });
};

const TableRow = ({ match, showCountdown }: { match: Match; showCountdown: boolean }) => {
  const { data } = useGetParticipants();

  const { time } = formatDate(match.date);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const seconds = Math.max(0, differenceInSeconds(new Date(match.date), now));

  const missingPreds = [];
  if (seconds < 86400 && data?.data) {
    for (const p of data.data) {
      const m = p.predictions.find(p => p.id === match.id);
      if (!m) {
        continue;
      }
      if (m.homeScore === undefined || m.awayScore === undefined) {
        missingPreds.push(p.name);
      }
    }
  }

  return (
    <TRow key={match.id}>
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

      <TableCell
        className={classNames(`w-20`, {
          'text-red-600 font-bold': seconds < 3600,
        })}
      >
        {showCountdown && renderCountdown(seconds)}
      </TableCell>
      <TableCell className="w-24 text-red-600 font-bold">
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
      </TableCell>
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

export const Route = createFileRoute('/matches/')({
  component: RouteComponent,
});
