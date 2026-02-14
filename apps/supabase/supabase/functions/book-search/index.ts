import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import { authenticateRequest } from '../_shared/auth.ts';
import { corsResponse, errorResponse, successResponse } from '../_shared/responses.ts';

// =============================================================================
// Aladin API Types
// =============================================================================

interface AladinBookItem {
  title: string;
  author: string;
  pubDate: string;
  description: string;
  isbn: string;
  isbn13: string;
  itemId: number;
  cover: string;
  categoryId: number;
  categoryName: string;
  publisher: string;
  customerReviewRank: number;
  subInfo?: {
    itemPage?: number;
  };
}

interface AladinSearchResponse {
  version: string;
  totalResults: number;
  startIndex: number;
  itemsPerPage: number;
  item?: AladinBookItem[];
}

interface AladinLookupResponse {
  version: string;
  item?: AladinBookItem[];
}

// =============================================================================
// Helpers
// =============================================================================

function parseAladinResponse(text: string): unknown {
  const jsonpMatch = text.match(/^SearchResult\(([\s\S]*)\);?\s*$/);
  return JSON.parse(jsonpMatch ? jsonpMatch[1] : text);
}

function toBookShape(item: AladinBookItem) {
  return {
    title: item.title,
    author: item.author,
    publisher: item.publisher,
    cover: item.cover,
    isbn13: item.isbn13,
    totalPages: item.subInfo?.itemPage ?? null,
    pubDate: item.pubDate,
    description: item.description,
    categoryName: item.categoryName,
  };
}

async function handleSearch(ttbKey: string, query: string, maxResults: string): Promise<Response> {
  const params = new URLSearchParams({
    ttbkey: ttbKey,
    Query: query,
    QueryType: 'Title',
    MaxResults: maxResults,
    start: '1',
    SearchTarget: 'Book',
    output: 'js',
    Version: '20131101',
    Cover: 'Big',
    OptResult: 'subInfo',
  });

  const res = await fetch(`https://www.aladin.co.kr/ttb/api/ItemSearch.aspx?${params}`, {
    headers: { 'User-Agent': 'BookLog/1.0' },
  });
  if (!res.ok) return errorResponse(`External API error: ${res.status} ${res.statusText}`, 502);

  try {
    const data = parseAladinResponse(await res.text()) as AladinSearchResponse;
    return successResponse((data.item ?? []).map(toBookShape));
  } catch {
    return errorResponse('Failed to parse API response', 502);
  }
}

async function handleLookup(ttbKey: string, isbn13: string): Promise<Response> {
  const params = new URLSearchParams({
    ttbkey: ttbKey,
    itemIdType: 'ISBN13',
    ItemId: isbn13,
    output: 'js',
    Version: '20131101',
    OptResult: 'subInfo',
  });

  const res = await fetch(`https://www.aladin.co.kr/ttb/api/ItemLookUp.aspx?${params}`, {
    headers: { 'User-Agent': 'BookLog/1.0' },
  });
  if (!res.ok) return errorResponse(`External API error: ${res.status} ${res.statusText}`, 502);

  try {
    const data = parseAladinResponse(await res.text()) as AladinLookupResponse;
    const item = data.item?.[0];
    if (!item) return errorResponse('Book not found', 404);
    return successResponse(toBookShape(item));
  } catch {
    return errorResponse('Failed to parse API response', 502);
  }
}

// =============================================================================
// Handler
// =============================================================================

serve(async (req) => {
  if (req.method === 'OPTIONS') return corsResponse();

  try {
    // Require authentication to prevent abuse of the API key
    const authResult = await authenticateRequest(req);
    if (authResult instanceof Response) return authResult;

    const ttbKey = Deno.env.get('ALADIN_TTB_KEY');
    if (!ttbKey) {
      return errorResponse('Server configuration error: missing API key', 500);
    }

    const url = new URL(req.url);
    const isbn13 = url.searchParams.get('isbn13');

    if (isbn13) {
      return await handleLookup(ttbKey, isbn13);
    }

    const query = url.searchParams.get('query');
    const maxResults = url.searchParams.get('maxResults') ?? '10';

    if (!query || query.trim().length < 1) {
      return errorResponse('query parameter is required');
    }

    return await handleSearch(ttbKey, query.trim(), maxResults);
  } catch (error) {
    console.error('Unexpected error in book-search:', error);
    return errorResponse('Internal server error', 500);
  }
});
