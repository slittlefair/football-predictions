import { useGetTeams } from '@/api/generated';

interface ITeamDisplayProps {
  displayName: string;
  flagPosition?: 'left' | 'right';
  teamOverride?: string;
}

export const TeamDisplay = ({
  displayName,
  teamOverride,
  flagPosition = 'right',
}: ITeamDisplayProps) => {
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
      <img
        className="border shadow"
        src={`https://flagcdn.com/${team.code.toLowerCase()}.svg`}
        alt={displayName}
        width={40}
      />
    </div>
  );
};
