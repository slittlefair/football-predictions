import { createFileRoute, Outlet, useMatch } from '@tanstack/react-router';
import { cn } from '@/lib/utils';

export const Route = createFileRoute('/_app')({
  component: AppLayout,
});

function AppLayout() {
  const match = useMatch({
    from: '/_app/participants/$name',
    shouldThrow: false,
  });

  return (
    <div className={cn('flex h-full flex-col pt-6', match ? 'overflow-hidden' : 'overflow-y-auto')}>
      <div className="mx-auto flex min-h-0 flex-1 w-full max-w-5xl flex-col items-center">
        <Outlet />
      </div>
    </div>
  );
}
