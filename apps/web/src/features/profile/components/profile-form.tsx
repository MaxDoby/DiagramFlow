import { useState, type SubmitEvent } from 'react';
import { updateProfileSchema } from '@diagram-flow/contracts';
import * as z from 'zod';
import { Save } from 'lucide-react';
import { useUpdateProfileMutation } from '../queries/profile-queries';

type ProfileFormProps = {
  name: string | null;
};

export const ProfileForm = ({ name }: ProfileFormProps) => {
  const [nameError, setNameError] = useState<string>();
  const updateProfileMutation = useUpdateProfileMutation();

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault();
    updateProfileMutation.reset();

    const formData = new FormData(event.currentTarget);
    const validationResult = updateProfileSchema.safeParse({
      name: formData.get('name'),
    });

    if (!validationResult.success) {
      const errors = z.flattenError(validationResult.error).fieldErrors;
      setNameError(errors.name?.[0]);
      return;
    }

    setNameError(undefined);
    updateProfileMutation.mutate(validationResult.data);
  };

  const requestError =
    updateProfileMutation.error instanceof Error
      ? updateProfileMutation.error.message
      : undefined;

  return (
    <section aria-labelledby="personal-details-title">
      <h2 id="personal-details-title" className="text-lg font-semibold">
        Personal details
      </h2>

      <form
        className="mt-5 max-w-md space-y-4"
        onSubmit={handleSubmit}
        noValidate
      >
        <div className="space-y-2">
          <label className="block text-sm font-medium" htmlFor="profile-name">
            Name
          </label>

          <input
            id="profile-name"
            name="name"
            type="text"
            defaultValue={name ?? ''}
            maxLength={100}
            autoComplete="name"
            className="h-11 w-full rounded-md border border-zinc-300
              bg-white px-3 text-sm outline-none focus:border-teal-700
              focus:ring-2 focus:ring-teal-100
              aria-[invalid=true]:border-red-500"
            aria-invalid={Boolean(nameError)}
            aria-describedby="profile-name-error"
            onChange={() => setNameError(undefined)}
          />

          <p
            id="profile-name-error"
            className="min-h-5 text-sm text-red-600"
            aria-live="polite"
          >
            {nameError}
          </p>
        </div>

        {requestError && (
          <p className="text-sm text-red-600" role="alert">
            {requestError}
          </p>
        )}

        {updateProfileMutation.isSuccess && (
          <p className="text-sm text-teal-700" role="status">
            Profile updated.
          </p>
        )}

        <button
          className="flex h-10 items-center justify-center gap-2
            rounded-md bg-zinc-900 px-4 text-sm font-medium text-white
            hover:bg-zinc-800 disabled:cursor-not-allowed
            disabled:opacity-60"
          type="submit"
          disabled={updateProfileMutation.isPending}
        >
          <Save aria-hidden="true" size={16} />
          {updateProfileMutation.isPending ? 'Saving...' : 'Save name'}
        </button>
      </form>
    </section>
  );
};
