import { createFileRoute } from '@tanstack/react-router';
import { type Match, useGetMatches } from '@/api/generated';
import { FlagDisplay } from '@/components/FlagDisplay';
import { RouterButton } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';
import { formatDate } from '@/utils/date';

const RouteComponent = () => {
  const { data, isLoading, error } = useGetMatches();

  if (error) {
    return <p>Something went wrong</p>;
  }

  if (isLoading || !data) {
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

  return matchSections.map(sec => {
    const { date } = formatDate(sec[0].date);
    return (
      <div key={date}>
        <h3>{date}</h3>
        <Table className="w-xl">
          <TableBody>
            {sec.map(match => {
              const { time } = formatDate(match.date);
              return (
                <TableRow key={match.id}>
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
                  <TableCell>
                    <RouterButton to="/matches/$id" params={{ id: String(match.id) }}>
                      View
                    </RouterButton>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    );
  });
};

export const Route = createFileRoute('/matches/')({
  component: RouteComponent,
});
