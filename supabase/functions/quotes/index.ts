import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import {
  authenticateRequest,
  corsResponse,
  errorResponse,
  successResponse,
  createdResponse,
} from '../_shared/index.ts';

// =============================================================================
// POST /quotes — Create
// =============================================================================

async function handleCreate(
  supabase: SupabaseClient,
  userId: string,
  payload: { reading_log_id?: string; text?: string; page_number?: number; noted_at?: string }
): Promise<Response> {
  if (!payload.reading_log_id || !payload.text || !payload.page_number) {
    return errorResponse('reading_log_id, text, page_number are required');
  }

  const { data, error } = await supabase
    .from('quotes')
    .insert([
      {
        reading_log_id: payload.reading_log_id,
        text: payload.text,
        page_number: payload.page_number,
        noted_at: payload.noted_at ?? null,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return createdResponse(data);
}

// =============================================================================
// PUT /quotes — Update
// =============================================================================

async function handleUpdate(
  supabase: SupabaseClient,
  userId: string,
  payload: { id?: string; text?: string; page_number?: number; noted_at?: string }
): Promise<Response> {
  if (!payload.id) return errorResponse('id is required');

  const { data, error } = await supabase
    .from('quotes')
    .update({
      text: payload.text,
      page_number: payload.page_number,
      noted_at: payload.noted_at,
    })
    .eq('id', payload.id)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) return errorResponse(error.message, 500);

  return successResponse(data);
}

// =============================================================================
// DELETE /quotes?id= — Delete
// =============================================================================

async function handleDelete(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Response> {
  const { error } = await supabase.from('quotes').delete().eq('id', id).eq('user_id', userId);

  if (error) return errorResponse(error.message, 500);

  return successResponse({ deleted: true, quote_id: id });
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
