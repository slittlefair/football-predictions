import { createFileRoute } from '@tanstack/react-router';
import { useGetMatches } from '@/api/generated';

const RouteComponent = () => {
  const { data, isLoading, error } = useGetMatches();
  console.log({ data, isLoading, error });
};

export const Route = createFileRoute('/matches')({
  component: RouteComponent,
});
