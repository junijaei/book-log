import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  NICKNAME_MIN_LENGTH,
  NICKNAME_MAX_LENGTH,
  UPDATABLE_PROFILE_FIELDS,
  FORBIDDEN_PROFILE_FIELDS,
  PROFILE_SEARCH_DEFAULT_LIMIT,
  PROFILE_SEARCH_MIN_LENGTH,
  authenticateRequest,
  corsResponse,
  errorResponse,
  successResponse,
  isValidUUID,
  escapeSearchTerm,
  sanitizePagination,
  getBlockedUserIds,
} from '../_shared/index.ts';
import type { UpdateProfilePayload } from '../_shared/index.ts';

// =============================================================================
// GET /profiles — Get own profile
// =============================================================================

async function handleGet(supabase: SupabaseClient, userId: string): Promise<Response> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, bio, created_at, updated_at')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Profile not found', 404);
    }
    console.error('Get profile error:', error);
    return errorResponse('Failed to fetch profile', 500);
  }

  if (!data) return errorResponse('Profile not found', 404);

  return successResponse(data);
}

// =============================================================================
// GET /profiles?user_id= — Public profile
// =============================================================================

async function handleGetPublicProfile(
  supabase: SupabaseClient,
  userId: string,
  targetUserId: string
): Promise<Response> {
  if (!isValidUUID(targetUserId)) {
    return errorResponse('Invalid user_id format. Must be a valid UUID');
  }

  if (targetUserId === userId) {
    return await handleGet(supabase, userId);
  }

  const blockedIds = await getBlockedUserIds(supabase, userId);
  if (blockedIds.includes(targetUserId)) {
    return errorResponse('User not found', 404);
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, avatar_url, bio')
    .eq('id', targetUserId)
    .maybeSingle();

  if (error) {
    console.error('Get public profile error:', error);
    return errorResponse('Failed to fetch profile', 500);
  }

  if (!data) return errorResponse('User not found', 404);

  return successResponse(data);
}

// =============================================================================
// GET /profiles?search= — User search
// =============================================================================

async function handleSearch(
  supabase: SupabaseClient,
  userId: string,
  searchParams: URLSearchParams
): Promise<Response> {
  const searchTerm = searchParams.get('search')?.trim() ?? '';

  if (searchTerm === '') {
    return errorResponse('Search term cannot be empty');
  }

  if (searchTerm.length < PROFILE_SEARCH_MIN_LENGTH) {
    return errorResponse(`search term must be at least ${PROFILE_SEARCH_MIN_LENGTH} characters`);
  }

  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const { limit, offset } = sanitizePagination(
    limitParam !== null ? Number(limitParam) : undefined,
    offsetParam !== null ? Number(offsetParam) : undefined,
    PROFILE_SEARCH_DEFAULT_LIMIT
  );

  const blockedIds = await getBlockedUserIds(supabase, userId);

  const escapedSearch = escapeSearchTerm(searchTerm);
  const searchPattern = `%${escapedSearch}%`;

  let query = supabase
    .from('profiles')
    .select('id, nickname, avatar_url, bio', { count: 'exact' })
    .ilike('nickname', searchPattern)
    .neq('id', userId)
    .order('nickname', { ascending: true });

  for (const blockedId of blockedIds) {
    query = query.neq('id', blockedId);
  }

  query = query.range(offset, offset + limit - 1);

  const { data, error, count } = await query;

  if (error) {
    console.error('Search profiles error:', error);
    return errorResponse('Failed to search users', 500);
  }

  if (!data || data.length === 0) {
    return successResponse([], { limit, offset, count: 0, total: count ?? 0 });
  }

  return successResponse(data, {
    limit,
    offset,
    count: data.length,
    total: count ?? data.length,
  });
}

// =============================================================================
// PUT /profiles — Update own profile
// =============================================================================

function validateUpdatePayload(
  payload: Record<string, unknown>
): { valid: true; fields: UpdateProfilePayload } | { valid: false; error: string } {
  for (const key of Object.keys(payload)) {
    if ((FORBIDDEN_PROFILE_FIELDS as readonly string[]).includes(key)) {
      return { valid: false, error: `Cannot update field: ${key}` };
    }
  }

  const fields: UpdateProfilePayload = {};
  let hasUpdatableField = false;

  for (const key of UPDATABLE_PROFILE_FIELDS) {
    if (key in payload) {
      hasUpdatableField = true;
      (fields as Record<string, unknown>)[key] = payload[key];
    }
  }

  if (!hasUpdatableField) {
    return { valid: false, error: 'No updatable fields provided' };
  }

  if (fields.nickname !== undefined) {
    if (typeof fields.nickname !== 'string') {
      return { valid: false, error: 'nickname must be a string' };
    }
    const len = fields.nickname.length;
    if (len < NICKNAME_MIN_LENGTH || len > NICKNAME_MAX_LENGTH) {
      return {
        valid: false,
        error: `nickname must be between ${NICKNAME_MIN_LENGTH} and ${NICKNAME_MAX_LENGTH} characters`,
      };
    }
  }

  return { valid: true, fields };
}

async function handleUpdate(
  supabase: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>
): Promise<Response> {
  const validation = validateUpdatePayload(payload);
  if (!validation.valid) return errorResponse(validation.error);

  const { data, error } = await supabase
    .from('profiles')
    .update(validation.fields)
    .eq('id', userId)
    .select('id, nickname, avatar_url, bio, created_at, updated_at')
    .single();

  if (error) {
    if (error.code === '23505') {
      return errorResponse('nickname is already taken');
    }
    if (error.code === 'PGRST116') {
      return errorResponse('Profile not found', 404);
    }
    console.error('Update profile error:', error);
    return errorResponse('Failed to update profile', 500);
  }

  if (!data) return errorResponse('Profile not found', 404);

  return successResponse(data);
}

// =============================================================================
// Router
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  try {
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;
    const { supabase, userId } = authResult;

    const url = new URL(req.url);

    switch (req.method) {
      case 'GET': {
        const targetUserId = url.searchParams.get('user_id');
        const searchTerm = url.searchParams.get('search');

        if (targetUserId) {
          return await handleGetPublicProfile(supabase, userId, targetUserId);
        }
        if (searchTerm !== null) {
          return await handleSearch(supabase, userId, url.searchParams);
        }
        return await handleGet(supabase, userId);
      }

      case 'PUT': {
        let body: Record<string, unknown>;
        try {
          body = await req.json();
        } catch {
          return errorResponse('Invalid JSON body');
        }
        return await handleUpdate(supabase, userId, body);
      }

      default:
        return errorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});
