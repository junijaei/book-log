import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
// =============================================================================
// Constants
// =============================================================================
const VALID_STATUSES = [
  "want_to_read",
  "reading",
  "finished",
  "abandoned"
];
const VALID_SORT_FIELDS = [
  "updated_at",
  "start_date",
  "end_date",
  "created_at"
];
const VALID_SORT_DIRECTIONS = [
  "asc",
  "desc"
];
const MAX_LIMIT = 100;
const DEFAULT_LIMIT = 50;
// =============================================================================
// CORS Headers
// =============================================================================
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS"
};
// =============================================================================
// Utility Functions
// =============================================================================
/**
 * ILIKE 패턴에서 사용되는 특수문자 이스케이프
 */ function escapeSearchTerm(str) {
  return str.replace(/[%_\\]/g, "\\$&");
}
/**
 * 유효한 ISO 8601 날짜 형식인지 검증
 */ function isValidDateString(str) {
  if (!str || typeof str !== "string") return false;
  const date = new Date(str);
  return !isNaN(date.getTime());
}
/**
 * 에러 응답 생성 헬퍼
 */ function errorResponse(message, status = 400) {
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
/**
 * 성공 응답 생성 헬퍼
 */ function successResponse(data, meta) {
  return new Response(JSON.stringify({
    data,
    meta
  }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json"
    }
  });
}
function validateFilters(filters) {
  // Status 검증
  if (filters.status && filters.status.length > 0) {
    const invalidStatuses = filters.status.filter((s)=>!VALID_STATUSES.includes(s));
    if (invalidStatuses.length > 0) {
      return {
        valid: false,
        error: `Invalid status values: ${invalidStatuses.join(", ")}. Valid values are: ${VALID_STATUSES.join(", ")}`
      };
    }
  }
  // 날짜 형식 검증
  const dateFields = [
    {
      key: "start_date_from",
      value: filters.start_date_from
    },
    {
      key: "start_date_to",
      value: filters.start_date_to
    },
    {
      key: "end_date_from",
      value: filters.end_date_from
    },
    {
      key: "end_date_to",
      value: filters.end_date_to
    }
  ];
  for (const { key, value } of dateFields){
    if (value && !isValidDateString(value)) {
      return {
        valid: false,
        error: `Invalid date format for ${key}: "${value}". Use ISO 8601 format (e.g., 2024-01-15)`
      };
    }
  }
  // 날짜 범위 논리 검증
  if (filters.start_date_from && filters.start_date_to && new Date(filters.start_date_from) > new Date(filters.start_date_to)) {
    return {
      valid: false,
      error: "start_date_from cannot be after start_date_to"
    };
  }
  if (filters.end_date_from && filters.end_date_to && new Date(filters.end_date_from) > new Date(filters.end_date_to)) {
    return {
      valid: false,
      error: "end_date_from cannot be after end_date_to"
    };
  }
  // Search 검증 (빈 문자열이나 공백만 있는 경우)
  if (filters.search !== undefined && filters.search.trim() === "") {
    return {
      valid: false,
      error: "Search term cannot be empty"
    };
  }
  return {
    valid: true
  };
}
function validateSort(sort) {
  if (!VALID_SORT_FIELDS.includes(sort.field)) {
    return {
      valid: false,
      error: `Invalid sort field: "${sort.field}". Valid fields are: ${VALID_SORT_FIELDS.join(", ")}`
    };
  }
  if (!VALID_SORT_DIRECTIONS.includes(sort.direction)) {
    return {
      valid: false,
      error: `Invalid sort direction: "${sort.direction}". Valid values are: asc, desc`
    };
  }
  return {
    valid: true
  };
}
function sanitizePagination(limit, offset) {
  let sanitizedLimit = DEFAULT_LIMIT;
  let sanitizedOffset = 0;
  if (typeof limit === "number" && !isNaN(limit)) {
    sanitizedLimit = Math.min(Math.max(Math.floor(limit), 1), MAX_LIMIT);
  }
  if (typeof offset === "number" && !isNaN(offset)) {
    sanitizedOffset = Math.max(Math.floor(offset), 0);
  }
  return {
    limit: sanitizedLimit,
    offset: sanitizedOffset
  };
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
    // Parse request body
    let body;
    try {
      body = await req.json();
    } catch  {
      body = {};
    }
    const filters = body.filters ?? {};
    const sort = body.sort;
    const { limit, offset } = sanitizePagination(body.limit, body.offset);
    // ==========================================================================
    // Validate Inputs
    // ==========================================================================
    const filtersValidation = validateFilters(filters);
    if (!filtersValidation.valid) {
      return errorResponse(filtersValidation.error);
    }
    if (sort) {
      const sortValidation = validateSort(sort);
      if (!sortValidation.valid) {
        return errorResponse(sortValidation.error);
      }
    }
    // ==========================================================================
    // Handle Search Filter (Separate Query for Books)
    // ==========================================================================
    let matchingBookIds = null;
    if (filters.search && filters.search.trim()) {
      const escapedSearch = escapeSearchTerm(filters.search.trim());
      const searchPattern = `%${escapedSearch}%`;
      const { data: matchingBooks, error: searchError } = await supabase.from("books").select("id").or(`title.ilike.${searchPattern},author.ilike.${searchPattern}`);
      if (searchError) {
        console.error("Search query error:", searchError);
        return errorResponse(`Search failed: ${searchError.message}`);
      }
      if (!matchingBooks || matchingBooks.length === 0) {
        // 검색 결과가 없으면 빈 배열 반환
        return successResponse([], {
          limit,
          offset,
          count: 0
        });
      }
      matchingBookIds = matchingBooks.map((b)=>b.id);
    }
    // ==========================================================================
    // Build Main Query
    // ==========================================================================
    let query = supabase.from("reading_logs").select(`
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
      `);
    // ==========================================================================
    // Apply Filters
    // ==========================================================================
    // Search filter (book_id 기반)
    if (matchingBookIds !== null) {
      query = query.in("book_id", matchingBookIds);
    }
    // Status filter
    if (filters.status && filters.status.length > 0) {
      query = query.in("status", filters.status);
    }
    // Date range filters
    if (filters.start_date_from) {
      query = query.gte("start_date", filters.start_date_from);
    }
    if (filters.start_date_to) {
      query = query.lte("start_date", filters.start_date_to);
    }
    if (filters.end_date_from) {
      query = query.gte("end_date", filters.end_date_from);
    }
    if (filters.end_date_to) {
      query = query.lte("end_date", filters.end_date_to);
    }
    // ==========================================================================
    // Apply Sorting
    // ==========================================================================
    if (sort) {
      const ascending = sort.direction === "asc";
      query = query.order(sort.field, {
        ascending,
        nullsFirst: false
      });
    } else {
      // Default sort: updated_at desc
      query = query.order("updated_at", {
        ascending: false
      });
    }
    // ==========================================================================
    // Apply Pagination
    // ==========================================================================
    query = query.range(offset, offset + limit - 1);
    // ==========================================================================
    // Execute Query
    // ==========================================================================
    const { data: readingLogsWithBooks, error: queryError } = await query;
    if (queryError) {
      console.error("Query error:", queryError);
      return errorResponse(`Query failed: ${queryError.message}`);
    }
    if (!readingLogsWithBooks || readingLogsWithBooks.length === 0) {
      return successResponse([], {
        limit,
        offset,
        count: 0
      });
    }
    // ==========================================================================
    // Fetch Quotes for All Reading Logs
    // ==========================================================================
    const readingLogIds = readingLogsWithBooks.map((rl)=>rl.id);
    const { data: allQuotes, error: quotesError } = await supabase.from("quotes").select("*").in("reading_log_id", readingLogIds).order("page_number", {
      ascending: true
    });
    if (quotesError) {
      console.error("Quotes query error:", quotesError);
      return errorResponse(`Failed to fetch quotes: ${quotesError.message}`);
    }
    // Group quotes by reading_log_id
    const quotesByLogId = new Map();
    for (const quote of allQuotes || []){
      const existing = quotesByLogId.get(quote.reading_log_id) || [];
      existing.push(quote);
      quotesByLogId.set(quote.reading_log_id, existing);
    }
    // ==========================================================================
    // Transform to ReadingRecord[]
    // ==========================================================================
    const records = readingLogsWithBooks.map((row)=>{
      const book = row.books;
      const readingLog = {
        id: row.id,
        book_id: row.book_id,
        status: row.status,
        current_page: row.current_page,
        rating: row.rating,
        start_date: row.start_date,
        end_date: row.end_date,
        review: row.review,
        notion_page_id: row.notion_page_id,
        created_at: row.created_at,
        updated_at: row.updated_at
      };
      const quotes = quotesByLogId.get(row.id) || [];
      return {
        book,
        reading_log: readingLog,
        quotes
      };
    });
    // ==========================================================================
    // Return Response
    // ==========================================================================
    return successResponse(records, {
      limit,
      offset,
      count: records.length
    });
  } catch (error) {
    console.error("Unexpected error:", error);
    return errorResponse("Internal server error", 500);
  }
});
