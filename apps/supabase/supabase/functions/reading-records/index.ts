import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';
import type {
  Book,
  FeedScope,
  Quote,
  ReadingLog,
  ReadingRecord,
  ReadingRecordFilters,
  ReadingRecordSort,
  ReadingStatus,
  Review,
} from '../_shared/index.ts';
import {
  VALID_SCOPES,
  authenticateRequest,
  corsResponse,
  createdResponse,
  errorResponse,
  escapeSearchTerm,
  getBlockedUserIds,
  getFriendIds,
  isValidUUID,
  sanitizePagination,
  successResponse,
  validateFilters,
  validateSort,
} from '../_shared/index.ts';

// =============================================================================
// GET /reading-records — List
// =============================================================================

async function handleGetList(
  supabase: SupabaseClient,
  userId: string,
  searchParams: URLSearchParams
): Promise<Response> {
  const scope = (searchParams.get('scope') ?? 'me') as FeedScope;

  const statusParam = searchParams.get('status');
  const filters: ReadingRecordFilters = {
    status: statusParam ? (statusParam.split(',') as ReadingStatus[]) : undefined,
    start_date_from: searchParams.get('start_date_from') ?? undefined,
    start_date_to: searchParams.get('start_date_to') ?? undefined,
    end_date_from: searchParams.get('end_date_from') ?? undefined,
    end_date_to: searchParams.get('end_date_to') ?? undefined,
    search: searchParams.get('search') ?? undefined,
  };

  const sortField = searchParams.get('sort');
  const sortDirection = searchParams.get('direction');
  const sort: ReadingRecordSort | undefined = sortField
    ? {
        field: sortField as ReadingRecordSort['field'],
        direction: (sortDirection ?? 'desc') as ReadingRecordSort['direction'],
      }
    : undefined;

  const limitParam = searchParams.get('limit');
  const offsetParam = searchParams.get('offset');
  const { limit, offset } = sanitizePagination(
    limitParam !== null ? Number(limitParam) : undefined,
    offsetParam !== null ? Number(offsetParam) : undefined
  );

  if (!(VALID_SCOPES as readonly string[]).includes(scope)) {
    return errorResponse(`Invalid scope: "${scope}". Valid values are: ${VALID_SCOPES.join(', ')}`);
  }

  const filtersValidation = validateFilters(filters);
  if (!filtersValidation.valid) return errorResponse(filtersValidation.error!);

  if (sort) {
    const sortValidation = validateSort(sort);
    if (!sortValidation.valid) return errorResponse(sortValidation.error!);
  }

  // ========================================================================
  // Determine Visible User IDs Based on Scope
  // ========================================================================

  let friendIds: string[] = [];
  let blockedIds: string[] = [];

  if (scope !== 'me') {
    [friendIds, blockedIds] = await Promise.all([
      getFriendIds(supabase, userId),
      getBlockedUserIds(supabase, userId),
    ]);
  }

  // ========================================================================
  // Handle Search Filter
  // ========================================================================

  let matchingBookIds: string[] | null = null;

  if (filters.search?.trim()) {
    const escapedSearch = escapeSearchTerm(filters.search.trim());
    const searchPattern = `%${escapedSearch}%`;

    const { data: matchingBooks, error: searchError } = await supabase
      .from('books')
      .select('id')
      .or(`title.ilike.${searchPattern},author.ilike.${searchPattern}`);

    if (searchError) {
      console.error('Search query error:', searchError);
      return errorResponse(`Search failed: ${searchError.message}`);
    }

    if (!matchingBooks || matchingBooks.length === 0) {
      return successResponse([], { limit, offset, count: 0, scope });
    }

    matchingBookIds = matchingBooks.map((b: { id: string }) => b.id);
  }

  // ========================================================================
  // Build Reading Logs Query
  // ========================================================================

  let query = supabase.from('reading_logs').select(
    `
      id, book_id, status, current_page, rating,
      start_date, end_date, visibility, notion_page_id,
      created_at, updated_at, user_id,
      books!inner ( id, title, author, cover_image_url, total_pages, created_at, updated_at ),
      profiles!inner ( nickname, avatar_url )
    `,
    { count: 'exact' }
  );

  // ========================================================================
  // Apply Scope & Visibility Filters
  // ========================================================================

  if (scope === 'me') {
    query = query.eq('user_id', userId);
  } else if (scope === 'friends') {
    if (friendIds.length === 0) {
      query = query.eq('user_id', userId);
    } else {
      const friendIdsStr = friendIds.filter((id) => !blockedIds.includes(id)).join(',');
      if (friendIdsStr) {
        query = query.or(
          `user_id.eq.${userId},and(user_id.in.(${friendIdsStr}),visibility.in.(public,friends))`
        );
      } else {
        query = query.eq('user_id', userId);
      }
    }
  } else {
    // scope === 'all'
    const nonBlockedFriendIds = friendIds.filter((id) => !blockedIds.includes(id));
    const friendIdsStr = nonBlockedFriendIds.join(',');

    const conditions: string[] = [`user_id.eq.${userId}`, `visibility.eq.public`];

    if (friendIdsStr) {
      conditions.push(`and(user_id.in.(${friendIdsStr}),visibility.eq.friends)`);
    }

    query = query.or(conditions.join(','));

    if (blockedIds.length > 0) {
      for (const blockedId of blockedIds) {
        query = query.neq('user_id', blockedId);
      }
    }
  }

  // ========================================================================
  // Apply Filters
  // ========================================================================

  if (matchingBookIds !== null) {
    query = query.in('book_id', matchingBookIds);
  }
  if (filters.status && filters.status.length > 0) {
    query = query.in('status', filters.status);
  }
  if (filters.start_date_from) query = query.gte('start_date', filters.start_date_from);
  if (filters.start_date_to) query = query.lte('start_date', filters.start_date_to);
  if (filters.end_date_from) query = query.gte('end_date', filters.end_date_from);
  if (filters.end_date_to) query = query.lte('end_date', filters.end_date_to);

  // ========================================================================
  // Apply Sorting & Pagination
  // ========================================================================

  if (sort) {
    query = query.order(sort.field, { ascending: sort.direction === 'asc', nullsFirst: false });
  } else {
    query = query.order('updated_at', { ascending: false });
  }

  query = query.range(offset, offset + limit - 1);

  // ========================================================================
  // Execute & Transform
  // ========================================================================

  const { data: readingLogsWithBooks, error: queryError, count } = await query;

  if (queryError) {
    console.error('Query error:', queryError);
    return errorResponse(`Query failed: ${queryError.message}`);
  }

  if (!readingLogsWithBooks || readingLogsWithBooks.length === 0) {
    return successResponse([], { limit, offset, count: 0, total: count ?? 0, scope });
  }

  const readingLogIds = readingLogsWithBooks.map((rl: { id: string }) => rl.id);

  const [{ data: allQuotes, error: quotesError }, { data: allReviews, error: reviewsError }] =
    await Promise.all([
      supabase
        .from('quotes')
        .select('*')
        .in('reading_log_id', readingLogIds)
        .order('page_number', { ascending: true }),
      supabase
        .from('reviews')
        .select('*')
        .in('reading_log_id', readingLogIds)
        .order('created_at', { ascending: false }),
    ]);

  if (quotesError) {
    console.error('Quotes query error:', quotesError);
    return errorResponse(`Failed to fetch quotes: ${quotesError.message}`);
  }

  if (reviewsError) {
    console.error('Reviews query error:', reviewsError);
    return errorResponse(`Failed to fetch reviews: ${reviewsError.message}`);
  }

  const quotesByLogId = new Map<string, Quote[]>();
  for (const quote of allQuotes || []) {
    const existing = quotesByLogId.get(quote.reading_log_id) || [];
    existing.push(quote);
    quotesByLogId.set(quote.reading_log_id, existing);
  }

  const reviewsByLogId = new Map<string, Review[]>();
  for (const review of allReviews || []) {
    const existing = reviewsByLogId.get(review.reading_log_id) || [];
    existing.push(review);
    reviewsByLogId.set(review.reading_log_id, existing);
  }

  const records: ReadingRecord[] = readingLogsWithBooks.map(
    (row: ReadingLog & Record<string, unknown>) => {
      const book = row.books as unknown as Book;
      const profile = row.profiles as { nickname: string; avatar_url: string | null } | null;

      const readingLog: ReadingLog = {
        id: row.id,
        book_id: row.book_id,
        status: row.status,
        current_page: row.current_page,
        rating: row.rating,
        start_date: row.start_date,
        end_date: row.end_date,
        visibility: row.visibility,
        notion_page_id: row.notion_page_id,
        created_at: row.created_at,
        updated_at: row.updated_at,
        user_id: row.user_id,
      };

      return {
        book,
        reading_log: readingLog,
        quotes: quotesByLogId.get(row.id) || [],
        reviews: reviewsByLogId.get(row.id) || [],
        profile,
      };
    }
  );

  return successResponse(records, {
    limit,
    offset,
    count: records.length,
    total: count ?? records.length,
    scope,
  });
}

// =============================================================================
// GET /reading-records?id= — Single Record
// =============================================================================

async function handleGetOne(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Response> {
  if (!isValidUUID(id)) {
    return errorResponse('Invalid id format. Must be a valid UUID');
  }

  const { data: readingLogWithBook, error: queryError } = await supabase
    .from('reading_logs')
    .select(
      `
        id, book_id, status, current_page, rating,
        start_date, end_date, visibility, notion_page_id,
        created_at, updated_at, user_id,
        books!inner ( id, title, author, cover_image_url, total_pages, created_at, updated_at ),
        profiles!inner ( nickname, avatar_url )
      `
    )
    .eq('id', id)
    .single();

  if (queryError) {
    if (queryError.code === 'PGRST116') {
      return errorResponse('Reading record not found', 404);
    }
    console.error('Query error:', queryError);
    return errorResponse(`Query failed: ${queryError.message}`);
  }

  if (!readingLogWithBook) {
    return errorResponse('Reading record not found', 404);
  }

  // ========================================================================
  // Visibility Check — 본인이 아닌 경우 접근 권한 확인
  // ========================================================================

  const ownerId = readingLogWithBook.user_id;

  if (ownerId !== userId) {
    const blockedIds = await getBlockedUserIds(supabase, userId);
    if (blockedIds.includes(ownerId)) {
      return errorResponse('Reading record not found', 404);
    }

    if (readingLogWithBook.visibility === 'private') {
      return errorResponse('Reading record not found', 404);
    }

    if (readingLogWithBook.visibility === 'friends') {
      const friendIds = await getFriendIds(supabase, userId);
      if (!friendIds.includes(ownerId)) {
        return errorResponse('Reading record not found', 404);
      }
    }
  }

  // ========================================================================
  // Fetch Quotes, Reviews & Transform
  // ========================================================================

  const [{ data: quotes, error: quotesError }, { data: reviews, error: reviewsError }] =
    await Promise.all([
      supabase
        .from('quotes')
        .select('*')
        .eq('reading_log_id', id)
        .order('page_number', { ascending: true }),
      supabase
        .from('reviews')
        .select('*')
        .eq('reading_log_id', id)
        .order('created_at', { ascending: false }),
    ]);

  if (quotesError) {
    console.error('Quotes query error:', quotesError);
    return errorResponse(`Failed to fetch quotes: ${quotesError.message}`);
  }

  if (reviewsError) {
    console.error('Reviews query error:', reviewsError);
    return errorResponse(`Failed to fetch reviews: ${reviewsError.message}`);
  }

  const book = readingLogWithBook.books as unknown as Book;
  const profile = readingLogWithBook.profiles as {
    nickname: string;
    avatar_url: string | null;
  } | null;

  const readingLog: ReadingLog = {
    id: readingLogWithBook.id,
    book_id: readingLogWithBook.book_id,
    status: readingLogWithBook.status,
    current_page: readingLogWithBook.current_page,
    rating: readingLogWithBook.rating,
    start_date: readingLogWithBook.start_date,
    end_date: readingLogWithBook.end_date,
    visibility: readingLogWithBook.visibility,
    notion_page_id: readingLogWithBook.notion_page_id,
    created_at: readingLogWithBook.created_at,
    updated_at: readingLogWithBook.updated_at,
    user_id: readingLogWithBook.user_id,
  };

  const record: ReadingRecord = {
    book,
    reading_log: readingLog,
    quotes: quotes || [],
    reviews: reviews || [],
    profile,
  };

  return successResponse(record);
}

// =============================================================================
// POST /reading-records — Create (Book + ReadingLog)
// =============================================================================

async function handleCreate(
  supabase: SupabaseClient,
  userId: string,
  payload: { title?: string; author?: string; cover_image_url?: string; total_pages?: number }
): Promise<Response> {
  if (!payload.title) return errorResponse('title is required');
  if (!payload.author) return errorResponse('author is required');

  const { data: book, error: bookError } = await supabase
    .from('books')
    .insert([
      {
        title: payload.title,
        author: payload.author,
        cover_image_url: payload.cover_image_url ?? null,
        total_pages: payload.total_pages ?? null,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (bookError || !book) {
    return errorResponse(bookError?.message ?? 'Failed to create book', 500);
  }

  const { data: readingLog, error: logError } = await supabase
    .from('reading_logs')
    .insert([
      {
        book_id: book.id,
        status: 'want_to_read',
        current_page: null,
        rating: null,
        start_date: null,
        end_date: null,
        notion_page_id: null,
        user_id: userId,
      },
    ])
    .select()
    .single();

  if (logError || !readingLog) {
    return errorResponse(logError?.message ?? 'Failed to create reading log', 500);
  }

  return createdResponse({ book, reading_log: readingLog });
}

// =============================================================================
// PUT /reading-records — Upsert (Book + ReadingLog + Quotes + Reviews)
//
// Delegates to the `upsert_reading_record` PostgreSQL stored procedure so that
// all mutations execute inside a single database transaction. Any failure
// automatically rolls back every change made in that call.
// =============================================================================

interface UpsertPayload {
  book?: { id?: string; [key: string]: unknown };
  reading_log?: { id?: string; [key: string]: unknown };
  quotes?: { id?: string; [key: string]: unknown }[];
  delete_quote_ids?: string[];
  reviews?: { id?: string; [key: string]: unknown }[];
  delete_review_ids?: string[];
}

async function handleUpsert(
  supabase: SupabaseClient,
  userId: string,
  payload: UpsertPayload
): Promise<Response> {
  const { data, error } = await supabase.rpc('upsert_reading_record', {
    p_user_id: userId,
    p_payload: payload,
  });

  if (error) {
    console.error('upsert_reading_record RPC error:', error);
    const isOwnershipError =
      error.message.includes('not found') || error.message.includes('not owned');
    return errorResponse(error.message, isOwnershipError ? 404 : 500);
  }

  return successResponse(data);
}

// =============================================================================
// DELETE /reading-records?id= — Delete Reading Record + Book
// =============================================================================

async function handleDelete(
  supabase: SupabaseClient,
  userId: string,
  id: string
): Promise<Response> {
  if (!isValidUUID(id)) {
    return errorResponse('Invalid id format. Must be a valid UUID');
  }

  const { data: readingLog, error: fetchError } = await supabase
    .from('reading_logs')
    .select('id, book_id')
    .eq('id', id)
    .eq('user_id', userId)
    .single();

  if (fetchError || !readingLog) {
    return errorResponse('Reading log not found', 404);
  }

  const bookId = readingLog.book_id;

  // quotes, reviews는 FK ON DELETE CASCADE로 자동 삭제
  const { error: deleteLogError } = await supabase.from('reading_logs').delete().eq('id', id);

  if (deleteLogError) return errorResponse(deleteLogError.message, 500);

  const { error: deleteBookError } = await supabase
    .from('books')
    .delete()
    .eq('id', bookId)
    .eq('user_id', userId);

  if (deleteBookError) return errorResponse(deleteBookError.message, 500);

  return successResponse({ deleted: true, reading_log_id: id, book_id: bookId });
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
    const id = url.searchParams.get('id');

    switch (req.method) {
      case 'GET':
        return id
          ? await handleGetOne(supabase, userId, id)
          : await handleGetList(supabase, userId, url.searchParams);

      case 'POST':
        return await handleCreate(supabase, userId, await req.json());

      case 'PUT':
        return await handleUpsert(supabase, userId, await req.json());

      case 'DELETE': {
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
