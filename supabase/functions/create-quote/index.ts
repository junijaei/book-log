// supabase/functions/create-quote/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
};
serve(async (req)=>{
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: corsHeaders
    });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const token = req.headers.get('Authorization')?.split(' ')[1];
  if (!token) return new Response('Unauthorized', {
    status: 401,
    headers: corsHeaders
  });
  const { data: { user } } = await supabase.auth.getUser(token);
  if (!user) return new Response('Unauthorized', {
    status: 401,
    headers: corsHeaders
  });
  const payload = await req.json();
  if (!payload.reading_log_id || !payload.text || !payload.page_number) {
    return Response.json({
      message: 'reading_log_id, text, page_number are required'
    }, {
      status: 400,
      headers: corsHeaders
    });
  }
  const { data, error } = await supabase.from('quotes').insert([
    {
      reading_log_id: payload.reading_log_id,
      text: payload.text,
      page_number: payload.page_number,
      noted_at: payload.noted_at ?? null,
      user_id: user.id
    }
  ]).select().single();
  if (error) {
    return Response.json({
      message: error.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
  return Response.json({
    quote: data
  }, {
    headers: corsHeaders
  });
});
