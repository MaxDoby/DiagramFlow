import { UserRound } from 'lucide-react';
import { Link } from 'react-router-dom';

import { useProfileQuery } from '../queries/profile-queries';

export const ProfileLink = () => {
  const profileQuery = useProfileQuery();
  const avatarUrl = profileQuery.data?.avatarUrl;

  return (
    <Link
      className="flex size-10 shrink-0 items-center justify-center
        overflow-hidden rounded-md border border-zinc-300 bg-white
        hover:bg-zinc-100"
      to="/profile"
      aria-label="Profile"
      title="Profile"
      aria-busy={profileQuery.isPending}
    >
      {avatarUrl ? (
        <img className="size-full object-cover" src={avatarUrl} alt="" />
      ) : (
        <UserRound className="size-5" aria-hidden="true" />
      )}
    </Link>
  );
};
