import {
  profileResponseSchema,
  updateProfileSchema,
  type ProfileResponse,
  type UpdateProfileInput,
  changePasswordSchema,
  type ChangePasswordInput,
} from '@diagram-flow/contracts';
import { apiRequest } from '../../../shared/api/api-client';
import { throwApiError } from '../../../shared/api/throw-api-error';

export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiRequest('/api/profile');

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return profileResponseSchema.parse(payload);
};

export const updateProfile = async (
  input: UpdateProfileInput,
): Promise<ProfileResponse> => {
  const validatedInput = updateProfileSchema.parse(input);
  const response = await apiRequest('/api/profile', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedInput),
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return profileResponseSchema.parse(payload);
};

export const updateAvatar = async (avatar: File): Promise<ProfileResponse> => {
  const formData = new FormData();
  formData.append('avatar', avatar);

  const response = await apiRequest('/api/profile/avatar', {
    method: 'PATCH',
    body: formData,
  });

  if (!response.ok) {
    await throwApiError(response);
  }

  const payload: unknown = await response.json();

  return profileResponseSchema.parse(payload);
};

export const changePassword = async (
  input: ChangePasswordInput,
): Promise<void> => {
  const validatedInput = changePasswordSchema.parse(input);
  const response = await apiRequest('/api/profile/password', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(validatedInput),
  });
  if (!response.ok) {
    await throwApiError(response);
  }
};
