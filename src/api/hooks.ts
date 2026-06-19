import {
  type GetPredictionsParams,
  type Leaderboard,
  type Match,
  type Participant,
  type Prediction,
  type Team,
  useGetLeaderboard,
  useGetMatch,
  useGetMatches,
  useGetParticipant,
  useGetParticipants,
  useGetPredictions,
  useGetTeams,
} from '@/api/generated';

const select =
  <T>() =>
  (resp: { data: T }) =>
    resp.data;

const createQuery = <T>() => ({
  query: { select: select<T>() },
});

export const useLeaderboard = () => useGetLeaderboard(createQuery<Leaderboard[]>());

export const useMatches = () => useGetMatches(createQuery<Match[]>());

export const useMatch = (id: string) =>
  useGetMatch(Number(id), { query: { select: resp => resp.data } });

export const useParticipants = () => useGetParticipants(createQuery<Participant[]>());

export const useParticipant = (name: string) =>
  useGetParticipant(name, { query: { select: resp => resp.data } });

export const useTeams = () => useGetTeams(createQuery<Team[]>());

export const usePredictions = (params?: GetPredictionsParams) =>
  useGetPredictions(params, createQuery<Prediction[]>());
