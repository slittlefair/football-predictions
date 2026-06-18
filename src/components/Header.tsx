import { Link, useLocation } from '@tanstack/react-router';
import { useGetParticipants } from '@/api/generated';
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from '@/components/ui/navigation-menu';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const { pathname } = useLocation();
  return (
    <header className="px-2 flex justify-between bg-popover">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem active={pathname === '/'}>
            <NavigationMenuLink render={<Link to="/" />}>Home</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem active={pathname === '/matches'}>
            <NavigationMenuLink render={<Link to="/matches" />}>Matches</NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem active={pathname === '/missingPredictions'}>
            <NavigationMenuLink render={<Link to="/missingPredictions" />}>
              Missing Predictions
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem active={pathname === '/tournament'}>
            <NavigationMenuLink render={<Link to="/tournament" />}>Tournament</NavigationMenuLink>
          </NavigationMenuItem>
          <ParticipantsDropdown />
        </NavigationMenuList>
      </NavigationMenu>
      <ThemeToggle />
    </header>
  );
}

const ParticipantsDropdown = () => {
  const { data } = useGetParticipants();
  const { pathname } = useLocation();

  if (!data?.data) {
    return null;
  }

  return (
    <NavigationMenuItem active={pathname.includes('/participants')}>
      <NavigationMenuTrigger>Participants</NavigationMenuTrigger>
      <NavigationMenuContent>
        {data.data.map(p => (
          <NavigationMenuItem
            key={p.name}
            active={pathname.endsWith(p.name)}
            className={navigationMenuTriggerStyle()}
            render={<Link key={p.name} to="/participants/$name" params={{ name: p.name }} />}
          >
            {p.name}
          </NavigationMenuItem>
        ))}
      </NavigationMenuContent>
    </NavigationMenuItem>
  );
};
