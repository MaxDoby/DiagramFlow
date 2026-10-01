import { useState, type SubmitEvent } from 'react';
import { Upload, UserRound } from 'lucide-react';

import { useUpdateAvatarMutation } from '../queries/profile-queries';

const AVATAR_MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;

const ALLOWED_AVATAR_TYPES: ReadonlySet<string> = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

type AvatarFormProps = {
  avatarUrl: string | null;
};

export const AvatarForm = ({ avatarUrl }: AvatarFormProps) => {
  const [fileError, setFileError] = useState<string>();
  const updateAvatarMutation = useUpdateAvatarMutation();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateAvatarMutation.reset();

    const form = event.currentTarget;
    const formData = new FormData(form);
    const avatar = formData.get('avatar');

    if (!(avatar instanceof File) || avatar.size === 0) {
      setFileError('Select an avatar image');
      return;
    }

    if (!ALLOWED_AVATAR_TYPES.has(avatar.type)) {
      setFileError('Avatar must be a JPEG, PNG, or WebP image');
      return;
    }

    if (avatar.size > AVATAR_MAX_FILE_SIZE_BYTES) {
      setFileError('Avatar must not exceed 2 MB');
      return;
    }

    setFileError(undefined);

    updateAvatarMutation.mutate(avatar, {
      onSuccess: () => {
        form.reset();
      },
    });
  };

  const requestError =
    updateAvatarMutation.error instanceof Error
      ? updateAvatarMutation.error.message
      : undefined;

  return (
    <section aria-labelledby="avatar-title">
      <h2 id="avatar-title" className="text-lg font-semibold">
        Avatar
      </h2>

      <div className="mt-5 flex flex-col gap-5 sm:flex-row sm:items-start">
        {avatarUrl ? (
          <img
            className="h-20 w-20 rounded-full border border-zinc-200
              object-cover"
            src={avatarUrl}
            alt="Profile avatar"
          />
        ) : (
          <div
            className="flex h-20 w-20 items-center justify-center rounded-full border border-zinc-200 bg-zinc-100 text-zinc-500"
            role="img"
            aria-label="No profile avatar"
          >
            <UserRound aria-hidden="true" size={32} />
          </div>
        )}

        <form
          className="w-full max-w-md space-y-4"
          onSubmit={handleSubmit}
          noValidate
        >
          <div className="space-y-2">
            <label className="block text-sm font-medium" htmlFor="avatar-file">
              Profile image
            </label>

            <input
              id="avatar-file"
              name="avatar"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="block w-full text-sm text-zinc-700 file:mr-4 file:rounded-md file:border-0 file:bg-zinc-100
                file:px-3 file:py-2 file:text-sm file:font-medium
                hover:file:bg-zinc-200"
              aria-invalid={Boolean(fileError)}
              aria-describedby="avatar-file-error"
              onChange={() => setFileError(undefined)}
            />

            <p
              id="avatar-file-error"
              className="min-h-5 text-sm text-red-600"
              aria-live="polite"
            >
              {fileError}
            </p>
          </div>

          {requestError && (
            <p className="text-sm text-red-600" role="alert">
              {requestError}
            </p>
          )}

          {updateAvatarMutation.isSuccess && (
            <p className="text-sm text-teal-700" role="status">
              Avatar updated.
            </p>
          )}

          <button
            className="flex h-10 items-center justify-center gap-2
              rounded-md bg-zinc-900 px-4 text-sm font-medium text-white hover:bg-zinc-800 disabled:cursor-not-allowed
              disabled:opacity-60"
            type="submit"
            disabled={updateAvatarMutation.isPending}
          >
            <Upload aria-hidden="true" size={16} />
            {updateAvatarMutation.isPending ? 'Uploading...' : 'Upload avatar'}
          </button>
        </form>
      </div>
    </section>
  );
};
