import { Plus, Workflow } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ProfileLink } from '../../profile/components/profile-link';
import { LogoutButton } from '../../auth/components/logout-button';

type DashboardHeaderProps = {
  isCreating: boolean;
  onCreateDiagram: () => void;
};

export const DashboardHeader = ({
  isCreating,
  onCreateDiagram,
}: DashboardHeaderProps) => (
  <header className="border-b border-zinc-200 bg-white">
    <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
      <Link className="flex items-center gap-3 font-semibold" to="/diagrams">
        <span className="flex size-9 items-center justify-center rounded-md bg-teal-700 text-white">
          <Workflow className="size-5" aria-hidden="true" />
        </span>
        DiagramFlow
      </Link>

      <div className="flex items-center gap-2">
        <ProfileLink />
        <LogoutButton />

        <button
          className="flex size-10 shrink-0 items-center justify-center gap-2
  rounded-md bg-zinc-900 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-60 sm:h-10 sm:w-auto sm:px-4"
          type="button"
          onClick={onCreateDiagram}
          disabled={isCreating}
          aria-busy={isCreating}
          aria-label={isCreating ? 'Creating diagram' : 'Create diagram'}
          title={isCreating ? 'Creating diagram' : 'Create diagram'}
        >
          <Plus className="size-4" aria-hidden="true" />
          <span className="hidden sm:inline">
            {isCreating ? 'Creating...' : 'Create diagram'}
          </span>
        </button>
      </div>
    </div>
  </header>
);
