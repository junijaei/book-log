// supabase/functions/upsert-reading-records/index.ts
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
  const authHeader = req.headers.get('Authorization');
  const token = authHeader?.split(' ')[1];
  if (!token) {
    return new Response('Unauthorized', {
      status: 401,
      headers: corsHeaders
    });
  }
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  if (authError || !user) {
    return new Response('Unauthorized', {
      status: 401,
      headers: corsHeaders
    });
  }
  const payload = await req.json();
  try {
    /** 1. Book */ let bookId = payload.book?.id;
    if (payload.book) {
      const { data, error } = await supabase.from('books').upsert({
        ...payload.book,
        user_id: user.id
      }, {
        onConflict: 'id'
      }).select().single();
      if (error) throw error;
      bookId = data.id;
    }
    /** 2. Reading Log */ let readingLogId = payload.reading_log?.id;
    if (payload.reading_log) {
      const base = {
        ...payload.reading_log,
        book_id: bookId,
        user_id: user.id
      };
      const { data, error } = readingLogId ? await supabase.from('reading_logs').update(base).eq('id', readingLogId).select().single() : await supabase.from('reading_logs').insert(base).select().single();
      if (error) throw error;
      readingLogId = data.id;
    }
    /** 3. Quotes */ if (payload.quotes?.length) {
      const insertQuotes = payload.quotes.filter((q)=>!q.id).map((q)=>({
          ...q,
          reading_log_id: readingLogId,
          user_id: user.id
        }));
      const updateQuotes = payload.quotes.filter((q)=>q.id);
      if (insertQuotes.length) {
        const { error } = await supabase.from('quotes').insert(insertQuotes);
        if (error) throw error;
      }
      for (const q of updateQuotes){
        const { id, ...rest } = q;
        const { error } = await supabase.from('quotes').update(rest).eq('id', id);
        if (error) throw error;
      }
    }
    /** 4. Delete Quotes */ if (payload.delete_quote_ids?.length) {
      const { error } = await supabase.from('quotes').delete().in('id', payload.delete_quote_ids);
      if (error) throw error;
    }
    return Response.json({
      book_id: bookId,
      reading_log_id: readingLogId
    }, {
      headers: corsHeaders
    });
  } catch (err) {
    return Response.json({
      message: err.message
    }, {
      status: 500,
      headers: corsHeaders
    });
  }
});
