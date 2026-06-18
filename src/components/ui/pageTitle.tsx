import type { PropsWithChildren } from 'react';

export const PageTitle = ({ children }: PropsWithChildren) => (
  <h1 className="scroll-m-20 text-3xl font-bold tracking-tight text-balance mb-3">{children}</h1>
);

export const PageSubtitle = ({ children }: PropsWithChildren) => (
  <h3 className="scroll-m-20 text-2xl font-semibold tracking-tight">{children}</h3>
);
