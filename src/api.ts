import type { LeaderboardEntry, TournamentPredictions } from './types';

export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  const response = await fetch('http://localhost:8080/api/leaderboard');

  if (!response.ok) {
    throw new Error('Failed to fetch leaderboard');
  }

  return response.json();
};

export const getTournamentPredictions = async (): Promise<
  Record<string, TournamentPredictions>
> => {
  const response = await fetch('http://localhost:8080/api/tournament');

  if (!response.ok) {
    throw new Error('Failed to fetch tournament predictions');
  }

  return response.json();
};

export const getParticipants = async (): Promise<string[]> => {
  const response = await fetch('http://localhost:8080/api/participants');

  if (!response.ok) {
    throw new Error('Failed to fetch participants');
  }

  return response.json();
};
