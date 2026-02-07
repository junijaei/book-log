// =============================================================================
// CORS Headers
// =============================================================================

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
};

// =============================================================================
// Reading Record Constants
// =============================================================================

export const VALID_STATUSES = ['want_to_read', 'reading', 'finished', 'abandoned'] as const;

export const VALID_SORT_FIELDS = ['updated_at', 'start_date', 'end_date', 'created_at'] as const;

export const VALID_SORT_DIRECTIONS = ['asc', 'desc'] as const;

export const VALID_SCOPES = ['me', 'friends', 'all'] as const;

export const MAX_LIMIT = 100;
export const DEFAULT_LIMIT = 50;
