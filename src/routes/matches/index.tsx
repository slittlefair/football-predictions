import { createFileRoute } from '@tanstack/react-router';
import { useGetMatches } from '@/api/generated';
import { TeamDisplay } from '@/components/TeamDisplay';
import { RouterButton } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

const RouteComponent = () => {
  const { data, isLoading, error } = useGetMatches();

  if (error) {
    return <p>Something went wrong</p>;
  }

  if (isLoading || !data) {
    return <p>Loading...</p>;
  }

  return (
    <Table className="w-5xl">
      <TableHeader>
        <TableRow>
          <TableHead>Date</TableHead>
          <TableHead>Round</TableHead>
          <TableHead>Home</TableHead>
          <TableHead>Score</TableHead>
          <TableHead>Away</TableHead>
          <TableHead />
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.data.map(match => {
          return (
            <TableRow key={match.id}>
              <TableCell>{match.date}</TableCell>
              <TableCell>{match.round}</TableCell>
              <TableCell className="flex justify-end items-center">
                <TeamDisplay displayName={match.homeTeam} />
              </TableCell>
              <TableCell>
                {match.homeScore !== undefined && match.awayScore !== undefined
                  ? `${match.homeScore} - ${match.awayScore}`
                  : ''}
              </TableCell>
              <TableCell className="flex justify-start items-center">
                <TeamDisplay displayName={match.awayTeam} flagPosition="left" />
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
  );
};

export const Route = createFileRoute('/matches/')({
  component: RouteComponent,
});
