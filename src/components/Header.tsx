import { useQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { getParticipants } from '@/api';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  return (
    <header className="z-50 border-b border-(--border) px-4 backdrop-blur-lg">
      <nav className="page-wrap flex flex-wrap items-center gap-x-3 gap-y-2 py-3 sm:py-4">
        <div className="order-3 flex w-full flex-wrap items-center gap-x-4 gap-y-1 pb-1 text-sm font-semibold sm:order-0 sm:w-auto sm:flex-nowrap sm:pb-0">
          <Link to="/" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
            Home
          </Link>
          <Link to="/about" className="nav-link" activeProps={{ className: 'nav-link is-active' }}>
            Matches
          </Link>
          <Link
            to="/tournament"
            className="nav-link"
            activeProps={{ className: 'nav-link is-active' }}
          >
            Tournament
          </Link>
          <ParticipantsDropdown />
        </div>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
        </div>
      </nav>
    </header>
  );
}

const ParticipantsDropdown = () => {
  const query = useQuery({ queryKey: ['participants'], queryFn: getParticipants });

  if (query.isLoading || !query.data) {
    return null;
  }

  return (
    <details className="relative w-full sm:w-auto">
      <summary className="nav-link list-none cursor-pointer">Participants</summary>

      <div className="mt-2 min-w-56 rounded-xl border border-(--line) bg-green-100 p-2 shadow-lg sm:absolute sm:right-0">
        {query.data.map(p => (
          <a
            key={p}
            href={p}
            className="block rounded-lg px-3 py-2 text-sm text-green-700 no-underline transition hover:bg-green-700 hover:text-green-200"
          >
            {p}
          </a>
        ))}
      </div>
    </details>
  );
};
