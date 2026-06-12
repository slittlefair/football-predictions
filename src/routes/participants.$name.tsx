import { createFileRoute, useParams } from '@tanstack/react-router';
import classNames from 'classnames';
import { useGetMatches, useGetParticipant } from '@/api/generated';
import { FlagCell } from '@/components/FlagDisplay';
import { RouterButton } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export const Route = createFileRoute('/participants/$name')({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = useParams({ from: '/participants/$name' });
  const { data: participantResp } = useGetParticipant(name);
  const { data: matchesResp } = useGetMatches();

  if (!participantResp?.data) {
    return null;
  }

  const participant = participantResp.data;
  const { winner, runnerUp, thirdPlace, fourthPlace, topScorer, scorerNationality } =
    participant.tournamentPredictions;

  return (
    <div>
      <h3>{participant.name}</h3>

      <div className="p-3">
        <Table className="w-72">
          <TableBody>
            <TableRow>
              <TableCell>Winner</TableCell>
              <FlagCell text={winner} />
            </TableRow>
            <TableRow>
              <TableCell>Runner Up</TableCell>
              <FlagCell text={runnerUp} />
            </TableRow>
            <TableRow>
              <TableCell>Third Place</TableCell>
              <FlagCell text={thirdPlace} />
            </TableRow>
            <TableRow>
              <TableCell>Fourth Place</TableCell>
              <FlagCell text={fourthPlace} />
            </TableRow>
            <TableRow>
              <TableCell>TopScorer</TableCell>
              <FlagCell text={topScorer} code={scorerNationality} />
            </TableRow>
          </TableBody>
        </Table>
      </div>

      {matchesResp && (
        <div>
          <Table className="w-2xl">
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Round</TableHead>
                <TableHead>Home</TableHead>
                <TableHead>Score</TableHead>
                <TableHead>Away</TableHead>
                <TableHead>Prediction</TableHead>
                <TableHead>Points</TableHead>
                <TableHead />
              </TableRow>
            </TableHeader>
            <TableBody>
              {participant.predictions.map(p => {
                const match = matchesResp.data[p.id - 1];
                const havePrediction = p.homeScore !== undefined && p.awayScore !== undefined;
                const haveScore = match.homeScore !== undefined && match.awayScore !== undefined;
                return (
                  <TableRow
                    key={match.id}
                    className={classNames({
                      'bg-red-400': haveScore && p.points === 0,
                      'bg-yellow-400': haveScore && p.points > 0 && p.points < 3,
                      'bg-emerald-400': haveScore && p.points > 2,
                    })}
                  >
                    <TableCell>{match.date}</TableCell>
                    <TableCell>{match.round}</TableCell>
                    <TableCell>{match.homeTeam}</TableCell>
                    <TableCell>
                      {match.homeScore !== undefined && match.awayScore !== undefined
                        ? `${match.homeScore} - ${match.awayScore}`
                        : ''}
                    </TableCell>
                    <TableCell>{match.awayTeam}</TableCell>
                    <TableCell>{havePrediction && `${p.homeScore} - ${p.awayScore}`}</TableCell>
                    <TableCell>{havePrediction && haveScore && p.points}</TableCell>
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
      )}
    </div>
  );
}
