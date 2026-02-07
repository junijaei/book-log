import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// =============================================================================
// CORS Headers
// =============================================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS"
};
// =============================================================================
// Utility Functions
// =============================================================================
function errorResponse(message, status = 400) {
  return new Response(JSON.stringify({
    error: message
  }), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
function successResponse(data) {
  return new Response(JSON.stringify({
    data
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
/**
 * UUID v4 형식 검증
 */ function isValidUUID(str) {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(str);
}
// =============================================================================
// Main Handler
// =============================================================================
serve(async (req)=>{
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders
    });
  }
  // Only allow POST method
  if (req.method !== "POST") {
    return errorResponse("Method not allowed", 405);
  }
  try {
    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseKey) {
      console.error("Missing environment variables");
      return errorResponse("Server configuration error", 500);
    }
    const supabase = createClient(supabaseUrl, supabaseKey);
    // ==========================================================================
    // Extract and Validate reading_log_id
    // ==========================================================================
    let body;
    try {
      body = await req.json();
    } catch  {
      body = {
        filters: {
          reading_log_id: ''
        }
      };
    }
    const { reading_log_id: readingLogId } = body.filters ?? {};
    if (!readingLogId) {
      return errorResponse("Missing required parameter: id");
    }
    if (!isValidUUID(readingLogId)) {
      return errorResponse("Invalid id format. Must be a valid UUID");
    }
    // ==========================================================================
    // Fetch Reading Log with Book
    // ==========================================================================
    const { data: readingLogWithBook, error: queryError } = await supabase.from("reading_logs").select(`
        id,
        book_id,
        status,
        current_page,
        rating,
        start_date,
        end_date,
        review,
        notion_page_id,
        created_at,
        updated_at,
        books!inner (
          id,
          title,
          author,
          cover_image_url,
          total_pages,
          created_at,
          updated_at
        )
      `).eq("id", readingLogId).single();
    if (queryError) {
      // PGRST116: 결과가 없는 경우
      if (queryError.code === "PGRST116") {
        return errorResponse("Reading record not found", 404);
      }
      console.error("Query error:", queryError);
      return errorResponse(`Query failed: ${queryError.message}`);
    }
    if (!readingLogWithBook) {
      return errorResponse("Reading record not found", 404);
    }
    // ==========================================================================
    // Fetch Quotes
    // ==========================================================================
    const { data: quotes, error: quotesError } = await supabase.from("quotes").select("*").eq("reading_log_id", readingLogId).order("page_number", {
      ascending: true
    });
    if (quotesError) {
      console.error("Quotes query error:", quotesError);
      return errorResponse(`Failed to fetch quotes: ${quotesError.message}`);
    }
    // ==========================================================================
    // Transform to ReadingRecord
    // ==========================================================================
    const book = readingLogWithBook.books;
    const readingLog = {
      id: readingLogWithBook.id,
      book_id: readingLogWithBook.book_id,
      status: readingLogWithBook.status,
      current_page: readingLogWithBook.current_page,
      rating: readingLogWithBook.rating,
      start_date: readingLogWithBook.start_date,
      end_date: readingLogWithBook.end_date,
      review: readingLogWithBook.review,
      notion_page_id: readingLogWithBook.notion_page_id,
      created_at: readingLogWithBook.created_at,
      updated_at: readingLogWithBook.updated_at
    };
    const record = {
      book,
      reading_log: readingLog,
      quotes: quotes || []
    };
    // ==========================================================================
    // Return Response
    // ==========================================================================
    return successResponse(record);
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
});
