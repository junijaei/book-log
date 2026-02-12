import type {
  FriendAcceptResponse,
  FriendAutoAcceptResponse,
  FriendBlockResponse,
  FriendDeleteResponse,
  FriendListItem,
  FriendRejectResponse,
  FriendRequestResponse,
  FriendUnblockResponse,
  PaginatedResponse,
  ReceivedRequestItem,
  SentRequestItem,
} from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

const ENDPOINT = 'friends';

function invokeFriends<T>(body: Record<string, unknown>): Promise<T> {
  return invokeEdgeFunction<T>(ENDPOINT, { method: 'POST', body });
}

export async function sendFriendRequest(
  targetUserId: string
): Promise<FriendRequestResponse | FriendAutoAcceptResponse> {
  try {
    const response = await invokeFriends<{
      data: FriendRequestResponse | FriendAutoAcceptResponse;
    }>({
      action: 'request',
      target_user_id: targetUserId,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to send friend request');
  }
}

export async function acceptFriendRequest(friendshipId: string): Promise<FriendAcceptResponse> {
  try {
    const response = await invokeFriends<{ data: FriendAcceptResponse }>({
      action: 'accept',
      friendship_id: friendshipId,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to accept friend request');
  }
}

export async function rejectFriendRequest(friendshipId: string): Promise<FriendRejectResponse> {
  try {
    const response = await invokeFriends<{ data: FriendRejectResponse }>({
      action: 'reject',
      friendship_id: friendshipId,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to reject friend request');
  }
}

export async function deleteFriendship(friendshipId: string): Promise<FriendDeleteResponse> {
  try {
    const response = await invokeFriends<{ data: FriendDeleteResponse }>({
      action: 'delete',
      friendship_id: friendshipId,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to delete friendship');
  }
}

export async function blockUser(targetUserId: string): Promise<FriendBlockResponse> {
  try {
    const response = await invokeFriends<{ data: FriendBlockResponse }>({
      action: 'block',
      target_user_id: targetUserId,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to block user');
  }
}

export async function unblockUser(targetUserId: string): Promise<FriendUnblockResponse> {
  try {
    const response = await invokeFriends<{ data: FriendUnblockResponse }>({
      action: 'unblock',
      target_user_id: targetUserId,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to unblock user');
  }
}

export async function listFriends(
  limit?: number,
  offset?: number
): Promise<PaginatedResponse<FriendListItem>> {
  try {
    return await invokeFriends<PaginatedResponse<FriendListItem>>({
      action: 'list',
      ...(limit != null && { limit }),
      ...(offset != null && { offset }),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch friends list');
  }
}

export async function listReceivedRequests(
  limit?: number,
  offset?: number
): Promise<PaginatedResponse<ReceivedRequestItem>> {
  try {
    return await invokeFriends<PaginatedResponse<ReceivedRequestItem>>({
      action: 'received',
      ...(limit != null && { limit }),
      ...(offset != null && { offset }),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(
      error instanceof Error ? error.message : 'Failed to fetch received requests'
    );
  }
}

export async function listSentRequests(
  limit?: number,
  offset?: number
): Promise<PaginatedResponse<SentRequestItem>> {
  try {
    return await invokeFriends<PaginatedResponse<SentRequestItem>>({
      action: 'sent',
      ...(limit != null && { limit }),
      ...(offset != null && { offset }),
    });
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to fetch sent requests');
  }
}
