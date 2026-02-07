// supabase/functions/delete-reading-record/index.ts
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
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
  const supabase = createClient(Deno.env.get('SUPABASE_URL'), Deno.env.get('SUPABASE_SERVICE_ROLE_KEY'));
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', {
      status: 401,
      headers: corsHeaders
    });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return new Response('Unauthorized', {
      status: 401,
      headers: corsHeaders
    });
  }
  const { data: { user }, error: userError } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return new Response('Unauthorized', {
      status: 401,
      headers: corsHeaders
    });
  }
  const payload = await req.json();
  if (!payload.reading_log_id) {
    return Response.json({
      message: 'reading_log_id is required'
    }, {
      status: 400,
      headers: corsHeaders
    });
  }
  try {
    /**
     * 1. reading_log 조회 (소유권 + book_id 확보)
     */ const { data: readingLog, error: fetchError } = await supabase.from('reading_logs').select('id, book_id').eq('id', payload.reading_log_id).eq('user_id', user.id).single();
    if (fetchError || !readingLog) {
      return Response.json({
        message: 'Reading log not found'
      }, {
        status: 404,
        headers: corsHeaders
      });
    }
    const bookId = readingLog.book_id;
    /**
     * 2. reading_logs 삭제
     *    - quotes는 FK ON DELETE CASCADE로 자동 삭제
     */ const { error: deleteLogError } = await supabase.from('reading_logs').delete().eq('id', payload.reading_log_id);
    if (deleteLogError) throw deleteLogError;
    /**
     * 3. books 삭제
     */ const { error: deleteBookError } = await supabase.from('books').delete().eq('id', bookId).eq('user_id', user.id);
    if (deleteBookError) throw deleteBookError;
    return Response.json({
      deleted: true,
      reading_log_id: payload.reading_log_id,
      book_id: bookId
    }, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  } catch (err) {
    return Response.json({
      message: err.message
    }, {
      status: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      }
    });
  }
});
