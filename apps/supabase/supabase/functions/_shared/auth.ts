import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { errorResponse } from './responses.ts';

export type AuthResult = { supabase: SupabaseClient; userId: string };

export async function authenticateRequest(req: Request): Promise<AuthResult | Response> {
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

  if (!supabaseUrl || !supabaseKey) {
    return errorResponse('Server configuration error', 500);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) return errorResponse('Missing Authorization header', 401);

  const token = authHeader.split(' ')[1];
  if (!token) return errorResponse('Invalid Authorization format', 401);

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser(token);
  if (error || !user) return errorResponse('Invalid or expired token', 401);

  return { supabase, userId: user.id };
}
