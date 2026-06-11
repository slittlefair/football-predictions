import { createFileRoute, useParams } from '@tanstack/react-router';
import { useGetParticipant } from '@/api/generated';

export const Route = createFileRoute('/participants/$name')({
  component: RouteComponent,
});

function RouteComponent() {
  const { name } = useParams({ from: '/participants/$name' });
  const { data } = useGetParticipant(name);

  return <div>Hello {JSON.stringify(data?.data)}</div>;
}
