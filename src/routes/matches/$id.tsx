import { createFileRoute, useParams } from '@tanstack/react-router';
import classNames from 'classnames';
import { useGetMatch } from '@/api/generated';
import { FlagDisplay } from '@/components/FlagDisplay';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

export const Route = createFileRoute('/matches/$id')({
  component: RouteComponent,
});

function RouteComponent() {
  const { id } = useParams({ from: '/matches/$id' });
  const { data } = useGetMatch(Number(id));

  if (!data?.data) {
    return 'Error';
  }

  const { match, predictions } = data.data;

  const sortedPredictions = predictions.sort((a, b) => {
    if (a.points === b.points) {
      return a.participant.localeCompare(b.participant);
    }
    return b.points - a.points;
  });

  // TODO do this server side
  const haveScore = match.homeScore !== undefined && match.awayScore !== undefined;

  const home = <FlagDisplay displayName={match.homeTeam} />;
  const away = <FlagDisplay displayName={match.awayTeam} flagPosition="left" />;

  let display = (
    <>
      {home} v {away}
    </>
  );
  if (haveScore) {
    display = (
      <>
        {home} {match.homeScore} - {match.awayScore} {away}
      </>
    );
  }

  return (
    <div className="p-6">
      <h4 className="pb-3 font-bold flex gap-2">{display}</h4>

      <Table className="w-52">
        <TableBody>
          {sortedPredictions.map(p => {
            const state = !haveScore
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
                {haveScore && <TableCell>{p.points}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
