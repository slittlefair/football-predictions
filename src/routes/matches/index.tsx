import type { ButtonProps } from '@base-ui/react/button';
import { createFileRoute, createLink } from '@tanstack/react-router';
import { forwardRef } from 'react';
import { useGetMatches } from '@/api/generated';
import { Button } from '@/components/ui/button';
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
    <Table className="w-2xl">
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
              <TableCell>{match.homeTeam}</TableCell>
              <TableCell>
                {match.homeScore !== undefined && match.awayScore !== undefined
                  ? `${match.homeScore} - ${match.awayScore}`
                  : ''}
              </TableCell>
              <TableCell>{match.awayTeam}</TableCell>
              <TableCell>
                {/* TODO make individual match pages */}
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

// TODO move this into own component
const RouterButton = createLink(
  forwardRef<HTMLButtonElement, ButtonProps>((props, ref) => {
    return <Button ref={ref} {...props} />;
  }),
);

export const Route = createFileRoute('/matches/')({
  component: RouteComponent,
});
