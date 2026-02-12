import type { PaginatedResponse, Profile, PublicProfile, UpdateProfilePayload } from '@/types';
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

export async function getPublicProfile(userId: string): Promise<PublicProfile> {
  try {
    const response = await invokeEdgeFunction<{ data: PublicProfile }>(ENDPOINT, {
      method: 'GET',
      query: { user_id: userId },
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch public profile');
  }
}

export async function searchUsers(
  search: string,
  limit?: number,
  offset?: number
): Promise<PaginatedResponse<PublicProfile>> {
  try {
    const query: Record<string, string> = { search };
    if (limit !== undefined) query.limit = String(limit);
    if (offset !== undefined) query.offset = String(offset);

    return await invokeEdgeFunction<PaginatedResponse<PublicProfile>>(ENDPOINT, {
      method: 'GET',
      query,
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to search users');
  }
}
