import { Card } from '@/components/ui/card';

export const ErrorCard = ({ error }: { error: unknown }) => (
  <Card className="gap-3">
    <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight text-red-500">Error</h3>
    {error instanceof Error && <p>{error.message}</p>}
  </Card>
);
