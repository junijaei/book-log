import type { Profile, UpdateProfilePayload } from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

const ENDPOINT = 'profiles';

export async function getProfile(): Promise<Profile> {
  try {
    const response = await invokeEdgeFunction<{ data: Profile }>(ENDPOINT, {
      method: 'GET',
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch profile');
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<Profile> {
  try {
    const response = await invokeEdgeFunction<{ data: Profile }>(ENDPOINT, {
      method: 'PUT',
      body: payload,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to update profile');
  }
}
