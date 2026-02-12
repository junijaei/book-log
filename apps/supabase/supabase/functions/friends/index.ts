import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  authenticateRequest,
  corsResponse,
  errorResponse,
  successResponse,
  createdResponse,
  sanitizePagination,
} from '../_shared/index.ts';

// =============================================================================
// Types
// =============================================================================

type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked';

type FriendAction =
  | 'request'
  | 'accept'
  | 'reject'
  | 'delete'
  | 'block'
  | 'unblock'
  | 'list'
  | 'received'
  | 'sent';

interface FriendRequestBody {
  action: FriendAction;
  target_user_id?: string;
  friendship_id?: string;
  limit?: number;
  offset?: number;
}

interface ProfileInfo {
  id: string;
  nickname: string;
  avatar_url: string | null;
  bio: string | null;
}

// =============================================================================
// Constants
// =============================================================================

const VALID_ACTIONS: FriendAction[] = [
  'request',
  'accept',
  'reject',
  'delete',
  'block',
  'unblock',
  'list',
  'received',
  'sent',
];

const FRIENDS_DEFAULT_LIMIT = 20;

// =============================================================================
// Helpers
// =============================================================================

async function findExistingFriendship(supabase: SupabaseClient, userA: string, userB: string) {
  const { data, error } = await supabase
    .from('friendships')
    .select('*')
    .or(
      `and(requester_id.eq.${userA},addressee_id.eq.${userB}),and(requester_id.eq.${userB},addressee_id.eq.${userA})`
    )
    .maybeSingle();

  if (error) {
    console.error('findExistingFriendship error:', error);
    return { data: null, error };
  }

  return { data, error: null };
}

async function enrichWithProfile(
  supabase: SupabaseClient,
  userId: string
): Promise<ProfileInfo | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, bio')
    .eq('id', userId)
    .maybeSingle();

  if (error || !data) return null;
  return data;
}

// =============================================================================
// Action Handlers
// =============================================================================

async function handleRequest(supabase: SupabaseClient, userId: string, body: FriendRequestBody) {
  const targetId = body.target_user_id;
  if (!targetId) return errorResponse('target_user_id is required');
  if (targetId === userId) return errorResponse('Cannot send friend request to yourself');

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url')
    .eq('id', targetId)
    .maybeSingle();

  if (!targetProfile) return errorResponse('User not found', 404);

  const { data: existing, error: findError } = await findExistingFriendship(
    supabase,
    userId,
    targetId
  );

  if (findError) return errorResponse('Failed to check existing relationship', 500);

  if (existing) {
    switch (existing.status as FriendshipStatus) {
      case 'accepted':
        return errorResponse('Already friends');

      case 'pending': {
        if (existing.requester_id === userId) {
          return errorResponse('Friend request already sent');
        }
        const { error: autoAcceptError } = await supabase
          .from('friendships')
          .update({ status: 'accepted', updated_at: new Date().toISOString() })
          .eq('id', existing.id);

        if (autoAcceptError) return errorResponse('Failed to auto-accept request', 500);

        return successResponse({
          id: existing.id,
          status: 'accepted',
          message: 'Friend request auto-accepted (mutual request)',
          friend: targetProfile,
        });
      }

      case 'blocked':
        return errorResponse('Unable to send friend request');

      case 'rejected':
        await supabase.from('friendships').delete().eq('id', existing.id);
        break;
    }
  }

  const { data: newFriendship, error: insertError } = await supabase
    .from('friendships')
    .insert({
      requester_id: userId,
      addressee_id: targetId,
      status: 'pending',
    })
    .select('id, status, created_at')
    .single();

  if (insertError) {
    console.error('Insert friendship error:', insertError);
    return errorResponse('Failed to send friend request', 500);
  }

  return createdResponse({ ...newFriendship, addressee: targetProfile });
}

async function handleAccept(supabase: SupabaseClient, userId: string, body: FriendRequestBody) {
  const friendshipId = body.friendship_id;
  if (!friendshipId) return errorResponse('friendship_id is required');

  const { data: friendship, error: findError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .maybeSingle();

  if (findError || !friendship) return errorResponse('Friend request not found', 404);
  if (friendship.addressee_id !== userId)
    return errorResponse('Only the request recipient can accept', 403);
  if (friendship.status !== 'pending')
    return errorResponse(`Cannot accept request with status "${friendship.status}"`);

  const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'accepted', updated_at: new Date().toISOString() })
    .eq('id', friendshipId);

  if (updateError) return errorResponse('Failed to accept request', 500);

  const requesterProfile = await enrichWithProfile(supabase, friendship.requester_id);

  return successResponse({ id: friendshipId, status: 'accepted', friend: requesterProfile });
}

async function handleReject(supabase: SupabaseClient, userId: string, body: FriendRequestBody) {
  const friendshipId = body.friendship_id;
  if (!friendshipId) return errorResponse('friendship_id is required');

  const { data: friendship, error: findError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .maybeSingle();

  if (findError || !friendship) return errorResponse('Friend request not found', 404);
  if (friendship.addressee_id !== userId)
    return errorResponse('Only the request recipient can reject', 403);
  if (friendship.status !== 'pending')
    return errorResponse(`Cannot reject request with status "${friendship.status}"`);

  const { error: updateError } = await supabase
    .from('friendships')
    .update({ status: 'rejected', updated_at: new Date().toISOString() })
    .eq('id', friendshipId);

  if (updateError) return errorResponse('Failed to reject request', 500);

  return successResponse({ id: friendshipId, status: 'rejected' });
}

async function handleDeleteFriend(
  supabase: SupabaseClient,
  userId: string,
  body: FriendRequestBody
) {
  const friendshipId = body.friendship_id;
  if (!friendshipId) return errorResponse('friendship_id is required');

  const { data: friendship, error: findError } = await supabase
    .from('friendships')
    .select('*')
    .eq('id', friendshipId)
    .maybeSingle();

  if (findError || !friendship) return errorResponse('Friendship not found', 404);

  if (friendship.requester_id !== userId && friendship.addressee_id !== userId) {
    return errorResponse('Not authorized', 403);
  }

  if (friendship.status === 'blocked') {
    return errorResponse('Cannot delete blocked relationship. Use "unblock" action instead');
  }

  const { error: deleteError } = await supabase.from('friendships').delete().eq('id', friendshipId);
  if (deleteError) return errorResponse('Failed to delete friendship', 500);

  return successResponse({ id: friendshipId, deleted: true });
}

async function handleBlock(supabase: SupabaseClient, userId: string, body: FriendRequestBody) {
  const targetId = body.target_user_id;
  if (!targetId) return errorResponse('target_user_id is required');
  if (targetId === userId) return errorResponse('Cannot block yourself');

  const { data: existing } = await findExistingFriendship(supabase, userId, targetId);

  if (existing) {
    if (existing.status === 'blocked') return errorResponse('User is already blocked');
    await supabase.from('friendships').delete().eq('id', existing.id);
  }

  const { data: blocked, error: insertError } = await supabase
    .from('friendships')
    .insert({
      requester_id: userId,
      addressee_id: targetId,
      status: 'blocked',
    })
    .select('id, status, created_at')
    .single();

  if (insertError) return errorResponse('Failed to block user', 500);

  return successResponse({ ...blocked, message: 'User blocked' });
}

async function handleUnblock(supabase: SupabaseClient, userId: string, body: FriendRequestBody) {
  const targetId = body.target_user_id;
  if (!targetId) return errorResponse('target_user_id is required');

  const { data: friendship, error: findError } = await supabase
    .from('friendships')
    .select('*')
    .eq('requester_id', userId)
    .eq('addressee_id', targetId)
    .eq('status', 'blocked')
    .maybeSingle();

  if (findError || !friendship) return errorResponse('Block relationship not found', 404);

  const { error: deleteError } = await supabase
    .from('friendships')
    .delete()
    .eq('id', friendship.id);

  if (deleteError) return errorResponse('Failed to unblock user', 500);

  return successResponse({ id: friendship.id, unblocked: true });
}

async function handleList(supabase: SupabaseClient, userId: string, body: FriendRequestBody) {
  const { limit, offset } = sanitizePagination(body.limit, body.offset, FRIENDS_DEFAULT_LIMIT);

  const {
    data: friendships,
    error,
    count,
  } = await supabase
    .from('friendships')
    .select('id, requester_id, addressee_id, created_at, updated_at', { count: 'exact' })
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('List friends error:', error);
    return errorResponse('Failed to fetch friends list', 500);
  }

  if (!friendships || friendships.length === 0) {
    return successResponse([], { limit, offset, count: 0, total: count ?? 0 });
  }

  const friendUserIds = friendships.map((f: { requester_id: string; addressee_id: string }) =>
    f.requester_id === userId ? f.addressee_id : f.requester_id
  );

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, bio')
    .in('id', friendUserIds);

  const profileMap = new Map<string, ProfileInfo>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  const result = friendships.map(
    (f: {
      id: string;
      requester_id: string;
      addressee_id: string;
      created_at: string;
      updated_at: string;
    }) => {
      const friendId = f.requester_id === userId ? f.addressee_id : f.requester_id;
      return {
        friendship_id: f.id,
        friend: profileMap.get(friendId) || { id: friendId },
        since: f.updated_at,
      };
    }
  );

  return successResponse(result, {
    limit,
    offset,
    count: result.length,
    total: count ?? result.length,
  });
}

async function handleReceived(supabase: SupabaseClient, userId: string, body: FriendRequestBody) {
  const { limit, offset } = sanitizePagination(body.limit, body.offset, FRIENDS_DEFAULT_LIMIT);

  const {
    data: requests,
    error,
    count,
  } = await supabase
    .from('friendships')
    .select('id, requester_id, created_at', { count: 'exact' })
    .eq('addressee_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Received requests error:', error);
    return errorResponse('Failed to fetch received requests', 500);
  }

  if (!requests || requests.length === 0) {
    return successResponse([], { limit, offset, count: 0, total: count ?? 0 });
  }

  const requesterIds = requests.map((r: { requester_id: string }) => r.requester_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, bio')
    .in('id', requesterIds);

  const profileMap = new Map<string, ProfileInfo>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  const result = requests.map((r: { id: string; requester_id: string; created_at: string }) => ({
    friendship_id: r.id,
    requester: profileMap.get(r.requester_id) || { id: r.requester_id },
    requested_at: r.created_at,
  }));

  return successResponse(result, {
    limit,
    offset,
    count: result.length,
    total: count ?? result.length,
  });
}

async function handleSent(supabase: SupabaseClient, userId: string, body: FriendRequestBody) {
  const { limit, offset } = sanitizePagination(body.limit, body.offset, FRIENDS_DEFAULT_LIMIT);

  const {
    data: requests,
    error,
    count,
  } = await supabase
    .from('friendships')
    .select('id, addressee_id, created_at', { count: 'exact' })
    .eq('requester_id', userId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    console.error('Sent requests error:', error);
    return errorResponse('Failed to fetch sent requests', 500);
  }

  if (!requests || requests.length === 0) {
    return successResponse([], { limit, offset, count: 0, total: count ?? 0 });
  }

  const addresseeIds = requests.map((r: { addressee_id: string }) => r.addressee_id);

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, bio')
    .in('id', addresseeIds);

  const profileMap = new Map<string, ProfileInfo>();
  for (const p of profiles || []) {
    profileMap.set(p.id, p);
  }

  const result = requests.map((r: { id: string; addressee_id: string; created_at: string }) => ({
    friendship_id: r.id,
    addressee: profileMap.get(r.addressee_id) || { id: r.addressee_id },
    requested_at: r.created_at,
  }));

  return successResponse(result, {
    limit,
    offset,
    count: result.length,
    total: count ?? result.length,
  });
}

// =============================================================================
// Router
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  if (req.method !== 'POST') {
    return errorResponse('Method not allowed. Use POST with an action field.', 405);
  }

  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;
    const { supabase, userId } = authResult;

    let body: FriendRequestBody;
    try {
      body = await req.json();
    } catch {
      return errorResponse('Invalid JSON body');
    }

    if (!body.action || !VALID_ACTIONS.includes(body.action)) {
      return errorResponse(`Invalid or missing action. Valid actions: ${VALID_ACTIONS.join(', ')}`);
    }

    switch (body.action) {
      case 'request':
        return await handleRequest(supabase, userId, body);
      case 'accept':
        return await handleAccept(supabase, userId, body);
      case 'reject':
        return await handleReject(supabase, userId, body);
      case 'delete':
        return await handleDeleteFriend(supabase, userId, body);
      case 'block':
        return await handleBlock(supabase, userId, body);
      case 'unblock':
        return await handleUnblock(supabase, userId, body);
      case 'list':
        return await handleList(supabase, userId, body);
      case 'received':
        return await handleReceived(supabase, userId, body);
      case 'sent':
        return await handleSent(supabase, userId, body);
      default:
        return errorResponse('Unknown action');
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});
