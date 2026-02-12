import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  authenticateRequest,
  corsResponse,
  errorResponse,
  successResponse,
  createdResponse,
  isValidUUID,
} from '../_shared/index.ts';

// =============================================================================
// GET /reviews?reading_log_id= — List reviews for a reading log
// =============================================================================

async function handleGetList(
  supabase: SupabaseClient,
  userId: string,
  readingLogId: string
): Promise<Response> {
  if (!isValidUUID(readingLogId)) {
    return errorResponse('Invalid reading_log_id format. Must be a valid UUID');
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('reading_log_id', readingLogId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) return errorResponse(error.message, 500);

  return successResponse(data ?? []);
}

// =============================================================================
// GET /reviews?id= — Get single review
// =============================================================================

async function handleGetOne(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Response> {
  if (!isValidUUID(id)) {
    return errorResponse('Invalid id format. Must be a valid UUID');
  }

  const { data, error } = await supabase
    .from('reviews')
    .select('*')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return errorResponse('Review not found', 404);
    }
    return errorResponse(error.message, 500);
  }

  return successResponse(data);
}

// =============================================================================
// POST /reviews — Create
// =============================================================================

async function handleCreate(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    reading_log_id?: string;
    content?: string;
    page_number?: number;
    reviewed_at?: string;
  }
): Promise<Response> {
  if (!payload.reading_log_id || !payload.content) {
    return errorResponse('reading_log_id and content are required');
  }

  const { data, error } = await supabase
    .from('reviews')
    .insert([
      {
        reading_log_id: payload.reading_log_id,
        content: payload.content,
        page_number: payload.page_number ?? null,
        reviewed_at: payload.reviewed_at ?? null,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return createdResponse(data);
}

// =============================================================================
// PUT /reviews — Update
// =============================================================================

async function handleUpdate(
  supabase: SupabaseClient,
  userId: string,
  payload: {
    id?: string;
    content?: string;
    page_number?: number;
    reviewed_at?: string;
  }
): Promise<Response> {
  if (!payload.id) return errorResponse('id is required');

  const { data, error } = await supabase
    .from('reviews')
    .update({
      content: payload.content,
      page_number: payload.page_number,
      reviewed_at: payload.reviewed_at,
    })
    .eq('id', payload.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return successResponse(data);
}

// =============================================================================
// DELETE /reviews?id= — Delete
// =============================================================================

async function handleDelete(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Response> {
  const { error } = await supabase.from('reviews').delete().eq('id', id).eq('user_id', userId);

  if (error) return errorResponse(error.message, 500);

  return successResponse({ deleted: true, review_id: id });
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
        const id = url.searchParams.get('id');
        const readingLogId = url.searchParams.get('reading_log_id');

        if (id) return await handleGetOne(supabase, userId, id);
        if (readingLogId) return await handleGetList(supabase, userId, readingLogId);
        return errorResponse('id or reading_log_id query parameter is required');
      }

      case 'POST':
        return await handleCreate(supabase, userId, await req.json());

      case 'PUT':
        return await handleUpdate(supabase, userId, await req.json());

      case 'DELETE': {
        const id = url.searchParams.get('id');
        if (!id) return errorResponse('id query parameter is required');
        return await handleDelete(supabase, userId, id);
      }

      default:
        return errorResponse('Method not allowed', 405);
    }
  } catch (error) {
    console.error('Unexpected error:', error);
    return errorResponse('Internal server error', 500);
  }
});
