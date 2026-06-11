import { createFileRoute, useParams } from '@tanstack/react-router';
import { useGetMatch } from '@/api/generated';
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

  const sortedPredictions = predictions.sort((a, b) => a.participant.localeCompare(b.participant));

  return (
    <div className="p-6">
      <h4 className="pb-3 font-bold">
        {match.homeTeam} v {match.awayTeam}
      </h4>

      <Table className="w-52">
        <TableBody>
          {sortedPredictions.map(p => {
            return (
              <TableRow key={p.participant}>
                <TableCell>{p.participant}</TableCell>
                <TableCell>
                  {p.homeScore} - {p.awayScore}
                </TableCell>
                {match.complete && <TableCell>{p.points}</TableCell>}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
