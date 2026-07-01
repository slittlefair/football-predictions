import { createFileRoute, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/_app/participants')({
  component: ParticipantsLayout,
});

function ParticipantsLayout() {
  return (
    <div className="flex h-full flex-col overflow-hidden p-6">
      <div className="mx-auto flex h-full w-full max-w-5xl flex-col">
        <Outlet />
      </div>
    </div>
  );
}
