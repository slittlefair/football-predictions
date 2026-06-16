import { faChevronLeft, faChevronRight } from '@fortawesome/free-solid-svg-icons';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { createFileRoute, useParams } from '@tanstack/react-router';
import classNames from 'classnames';
import type { ReactNode } from 'react';
import { type MatchNavigation, useGetMatch } from '@/api/generated';
import { FlagDisplay } from '@/components/FlagDisplay';
import { RouterButton } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/date';

export const Route = createFileRoute('/matches/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: '/matches/$id' });
  const { data } = useGetMatch(Number(id));

  if (!data?.data) {
    return 'Error';
  }

  const { match, predictions, previousNav, nextNav } = data.data;

  const sortedPredictions = predictions.sort((a, b) => {
    if (a.points === b.points) {
      return a.participant.localeCompare(b.participant);
    }
    return b.points - a.points;
  });

  const home = <FlagDisplay displayName={match.homeTeam} />;
  const away = <FlagDisplay displayName={match.awayTeam} flagPosition="left" />;
  const { date, time } = formatDate(match.date);

  let display = (
    <>
      {home} {time} {away}
    </>
  );
  if (match.hasResult) {
    display = (
      <>
        {home}{' '}
        <p className="font-bold text-xl">
          {match.homeScore} - {match.awayScore}
        </p>{' '}
        {away}
      </>
    );
  }

  return (
    <div className="p-6 flex flex-col items-center">
      {(previousNav || nextNav) && (
        <div className="flex w-full">
          <NavButton navItem={previousNav} leftIcon={<FontAwesomeIcon icon={faChevronLeft} />} />
          <NavButton
            navItem={nextNav}
            className="ml-auto"
            rightIcon={<FontAwesomeIcon icon={faChevronRight} />}
          />
        </div>
      )}
      <h3>
        {date} <span className="text-lg font-bold">●</span> {match.round}
      </h3>
      <h4 className="pb-3 font-bold flex gap-2 items-center">{display}</h4>

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
                  'bg-red-400 ': state === 'red',
                  'bg-yellow-400': state === 'orange',
                  'bg-emerald-400': state === 'green',
                })}
              >
                <TableCell>{p.participant}</TableCell>
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
