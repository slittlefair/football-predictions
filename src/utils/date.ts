import { format } from 'date-fns';

export const formatDate = (s: string) => {
  const d = new Date(s);

  return {
    date: format(d, 'EEEE do MMMM'),
    time: format(d, 'HH:mm'),
  };
};
