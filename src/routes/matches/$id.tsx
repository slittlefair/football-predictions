import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createFileRoute, useParams } from '@tanstack/react-router';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import { type MatchNavigation, useGetMatch } from '@/api/generated';
import Joker from '@/assets/joker.svg';
import { FlagDisplay } from '@/components/FlagDisplay';
import { RouterButton } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/date';

export const Route = createFileRoute('/matches/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: '/matches/$id' });
  const { data, isPending, error } = useGetMatch(Number(id));

  if (error) {
    return <div>{error}</div>;
  }

  if (isPending || !data?.data) {
    return <Spinner className="size-8" />;
  }

  const { match, predictions, previousNav, nextNav } = data.data;

  const sortedPredictions = predictions.sort((a, b) => {
    if (a.points === b.points) {
      return a.participant.localeCompare(b.participant);
    }
    return b.points - a.points;
  });
  const { date, time } = formatDate(match.date);

  return (
    <div className="flex flex-col items-center w-full">
      {(previousNav || nextNav) && (
        <div className="flex w-full mb-2">
          <NavButton
            navItem={previousNav}
            className="font-bold"
            leftIcon={<FontAwesomeIcon icon={faChevronLeft} />}
          />
          <NavButton
            navItem={nextNav}
            className="ml-auto font-bold"
            rightIcon={<FontAwesomeIcon icon={faChevronRight} />}
          />
        </div>
      )}
      <Card className="flex flex-col items-center gap-2 p-4 min-w-md">
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

        <Table className="w-52 m-auto">
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
                  className={classNames({
                    'bg-red-400 hover:bg-red-400': state === 'red',
                    'bg-yellow-400 hover:bg-yellow-400': state === 'orange',
                    'bg-emerald-400 hover:bg-emerald-400': state === 'green',
                  })}
                >
                  <TableCell>{p.participant}</TableCell>
                  <TableCell className="pl-0">
                    {p.usedJoker && <img src={Joker} alt="joker" className="h-6" />}
                  </TableCell>
                  <TableCell>
                    {p.homeScore !== undefined && p.awayScore !== undefined
                      ? `${p.homeScore} - ${p.awayScore}`
                      : '-'}
                  </TableCell>
                  {match.hasResult && <TableCell>{p.points}</TableCell>}
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
}

const NavButton = ({
  navItem,
  className,
  leftIcon,
  rightIcon,
}: {
  navItem?: MatchNavigation;
  className?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}) => {
  if (!navItem) {
    return null;
  }
  return (
    <RouterButton to="/matches/$id" params={{ id: String(navItem.id) }} className={className}>
      {leftIcon}
      {navItem.homeTeam} v {navItem.awayTeam}
      {rightIcon}
    </RouterButton>
  );
};
