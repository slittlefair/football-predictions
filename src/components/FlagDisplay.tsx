import { useGetTeams } from '@/api/generated';
import { TableCell } from '@/components/ui/table';

interface IFlagDisplayProps {
  displayName: string;
  flagPosition?: 'left' | 'right';
  teamOverride?: string;
}

export const FlagDisplay = ({
  displayName,
  teamOverride,
  flagPosition = 'right',
}: IFlagDisplayProps) => {
  const { data: resp } = useGetTeams();
  if (!resp) {
    return null;
  }

  const team = resp.data.find(t => t.displayName === (teamOverride || displayName));

  if (!team) {
    return <>{displayName}</>;
  }

  return (
    <div className={`flex gap-2 items-center ${flagPosition === 'left' && 'flex-row-reverse'}`}>
      {displayName}{' '}
      <div className="h-6 w-9 overflow-hidden border shadow">
        <img
          className="h-full w-full object-cover"
          src={`https://flagcdn.com/${team.code.toLowerCase()}.svg`}
          alt={displayName}
        />
      </div>
    </div>
  );
};

export const FlagCell = ({ text, code }: { text: string; code?: string }) => (
  <TableCell>
    <div className="flex justify-start">
      <FlagDisplay displayName={text} teamOverride={code} flagPosition="left" />
    </div>
  </TableCell>
);
