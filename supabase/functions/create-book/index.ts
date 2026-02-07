// supabase/functions/create-book/index.ts
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: corsHeaders,
    });
  }
  if (req.method !== 'POST') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL'),
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  );
  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
  const token = authHeader.split(' ')[1];
  if (!token) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);
  if (userError || !user) {
    return new Response('Unauthorized', {
      status: 401,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
  }
  const payload = await req.json();
  // 필수 필드 검증
  if (!payload.title) {
    return Response.json(
      {
        message: 'title is required',
      },
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
  if (!payload.author) {
    return Response.json(
      {
        message: 'author is required',
      },
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
  /**
   * 1. books insert
   */ const { data: book, error: bookError } = await supabase
    .from('books')
    .insert([
      {
        title: payload.title,
        author: payload.author,
        cover_image_url: payload.cover_image_url ?? null,
        total_pages: payload.total_pages ?? null,
        user_id: user.id,
      },
    ])
    .select()
    .single();
  if (bookError || !book) {
    return Response.json(
      {
        message: bookError?.message ?? 'Failed to create book',
      },
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
  /**
   * 2. reading_logs insert (default: want_to_read)
   */ const { data: readingLog, error: logError } = await supabase
    .from('reading_logs')
    .insert([
      {
        book_id: book.id,
        status: 'want_to_read',
        current_page: null,
        rating: null,
        start_date: null,
        end_date: null,
        review: null,
        notion_page_id: null,
        user_id: user.id,
      },
    ])
    .select()
    .single();
  if (logError || !readingLog) {
    return Response.json(
      {
        message: logError?.message ?? 'Failed to create reading log',
      },
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
  return Response.json(
    {
      book,
      reading_log: readingLog,
    },
    {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    }
  );
});
