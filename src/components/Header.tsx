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
    <header className="border-b p-2 flex justify-between bg-white">
      <NavigationMenu>
        <NavigationMenuList>
          <NavigationMenuItem>
            <NavigationMenuLink
              active={pathname === '/'}
              className={navigationMenuTriggerStyle()}
              render={<Link to="/" className="nav-link" />}
            >
              Home
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              // className={navigationMenuTriggerStyle()}
              render={
                <Link
                  to="/matches"
                  className="nav-link"
                  activeProps={{ className: 'nav-link is-active' }}
                />
              }
            >
              Matches
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              render={
                <Link
                  to="/missingPredictions"
                  className="nav-link"
                  activeProps={{ className: 'nav-link is-active' }}
                />
              }
            >
              Missing Predictions
            </NavigationMenuLink>
          </NavigationMenuItem>
          <NavigationMenuItem>
            <NavigationMenuLink
              className={navigationMenuTriggerStyle()}
              render={
                <Link
                  to="/tournament"
                  className="nav-link"
                  activeProps={{ className: 'nav-link is-active' }}
                />
              }
            >
              Tournament
            </NavigationMenuLink>
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

  if (!data?.data) {
    return null;
  }

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger>Participants</NavigationMenuTrigger>
      <NavigationMenuContent>
        {data.data.map(p => (
          <NavigationMenuItem
            key={p.name}
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
