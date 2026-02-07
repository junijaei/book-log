import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  NICKNAME_MIN_LENGTH,
  NICKNAME_MAX_LENGTH,
  UPDATABLE_PROFILE_FIELDS,
  FORBIDDEN_PROFILE_FIELDS,
  authenticateRequest,
  corsResponse,
  errorResponse,
  successResponse,
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

    switch (req.method) {
      case 'GET':
        return await handleGet(supabase, userId);

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
