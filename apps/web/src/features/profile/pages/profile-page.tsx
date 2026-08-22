import {
  ArrowLeft,
  LoaderCircle,
  RefreshCw,
  TriangleAlert,
  Workflow,
} from 'lucide-react';
import { Link } from 'react-router-dom';

import { AvatarForm } from '../components/avatar-form';
import { ChangePasswordForm } from '../components/change-password-form';
import { ProfileForm } from '../components/profile-form';
import { useProfileQuery } from '../queries/profile-queries';

export const ProfilePage = () => {
  const profileQuery = useProfileQuery();

  if (profileQuery.isPending) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 text-zinc-950">
        <div className="flex items-center gap-3 text-sm text-zinc-600">
          <LoaderCircle
            className="size-5 animate-spin text-teal-700"
            aria-hidden="true"
          />
          Loading profile...
        </div>
      </main>
    );
  }

  if (profileQuery.isError) {
    return (
      <main className="grid min-h-screen place-items-center bg-zinc-50 px-5 text-zinc-950">
        <section
          className="w-full max-w-sm text-center"
          aria-labelledby="profile-error-title"
        >
          <TriangleAlert
            className="mx-auto mb-4 size-9 text-red-600"
            aria-hidden="true"
          />

          <h1 id="profile-error-title" className="text-lg font-semibold">
            Unable to load profile
          </h1>

          <p className="mt-2 text-sm text-zinc-600" role="alert">
            {profileQuery.error.message}
          </p>

          <button
            className="mx-auto mt-5 flex h-10 items-center gap-2
              rounded-md border border-zinc-300 bg-white px-4 text-sm
              font-medium hover:bg-zinc-100 disabled:opacity-60"
            type="button"
            onClick={() => void profileQuery.refetch()}
            disabled={profileQuery.isFetching}
          >
            <RefreshCw
              className={`size-4 ${
                profileQuery.isFetching ? 'animate-spin' : ''
              }`}
              aria-hidden="true"
            />
            Try again
          </button>
        </section>
      </main>
    );
  }

  const profile = profileQuery.data;

  return (
    <main className="min-h-screen bg-zinc-50 text-zinc-950">
      <header className="border-b border-zinc-200 bg-white">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5">
          <Link
            className="flex items-center gap-3 font-semibold"
            to="/diagrams"
          >
            <span
              className="flex size-9 items-center justify-center
              rounded-md bg-teal-700 text-white"
            >
              <Workflow className="size-5" aria-hidden="true" />
            </span>
            DiagramFlow
          </Link>

          <Link
            className="flex h-10 items-center gap-2 rounded-md
              border border-zinc-300 bg-white px-3 text-sm font-medium
              hover:bg-zinc-100"
            to="/diagrams"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Diagrams
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-4xl px-5 py-8">
        <h1 className="text-2xl font-semibold">Profile</h1>
        <p className="mt-1 text-sm text-zinc-600">{profile.email}</p>

        <div className="mt-8 divide-y divide-zinc-200 border-y border-zinc-200">
          <div className="py-8">
            <ProfileForm name={profile.name} />
          </div>

          <div className="py-8">
            <AvatarForm avatarUrl={profile.avatarUrl} />
          </div>

          <div className="py-8">
            <ChangePasswordForm />
          </div>
        </div>
      </div>
    </main>
  );
};
