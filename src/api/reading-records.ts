/**
 * Reading Records API
 *
 * API functions for reading record operations via Edge Functions.
 * Endpoint: /functions/v1/reading-records
 */

import type {
  DeleteReadingRecordInput,
  DeleteReadingRecordResponse,
  PaginatedResponse,
  PaginationParams,
  ReadingRecord,
  ReadingRecordFilters,
  ReadingRecordSort,
  UpsertPayload,
  UpsertReadingRecordResponse,
} from '@/types';
import { invokeEdgeFunction } from './edge-functions';
import { ApiError } from './errors';

const ENDPOINT = 'reading-records';

function buildListQuery(
  filters?: ReadingRecordFilters,
  sort?: ReadingRecordSort,
  pagination?: PaginationParams
): Record<string, string> {
  const query: Record<string, string> = {};

  if (filters?.scope) query.scope = filters.scope;
  if (filters?.status?.length) query.status = filters.status.join(',');
  if (filters?.start_date_from) query.start_date_from = filters.start_date_from;
  if (filters?.start_date_to) query.start_date_to = filters.start_date_to;
  if (filters?.end_date_from) query.end_date_from = filters.end_date_from;
  if (filters?.end_date_to) query.end_date_to = filters.end_date_to;
  if (filters?.search) query.search = filters.search;

  if (sort?.field) query.sort = sort.field;
  if (sort?.direction) query.direction = sort.direction;

  if (pagination?.limit != null) query.limit = pagination.limit.toString();
  if (pagination?.offset != null) query.offset = pagination.offset.toString();

  return query;
}

export async function getReadingRecords(
  filters?: ReadingRecordFilters,
  sort?: ReadingRecordSort,
  pagination?: PaginationParams
): Promise<PaginatedResponse<ReadingRecord>> {
  const query = buildListQuery(filters, sort, pagination);

  return await invokeEdgeFunction<PaginatedResponse<ReadingRecord>>(ENDPOINT, {
    method: 'GET',
    query: Object.keys(query).length > 0 ? query : undefined,
  });
}

export async function getReadingRecord(id: string): Promise<ReadingRecord | null> {
  const response = await invokeEdgeFunction<{ data: ReadingRecord }>(ENDPOINT, {
    method: 'GET',
    query: { id },
  });

  return response.data ?? null;
}

export async function upsertReadingRecord(
  payload: UpsertPayload
): Promise<UpsertReadingRecordResponse> {
  try {
    const response = await invokeEdgeFunction<{ data: UpsertReadingRecordResponse }>(ENDPOINT, {
      method: 'PUT',
      body: payload,
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to upsert reading record');
  }
}

export async function deleteReadingRecord(
  input: DeleteReadingRecordInput
): Promise<DeleteReadingRecordResponse> {
  try {
    const response = await invokeEdgeFunction<{ data: DeleteReadingRecordResponse }>(ENDPOINT, {
      method: 'DELETE',
      query: { id: input.reading_log_id },
    });
    return response.data;
  } catch (error) {
    if (error instanceof ApiError) throw error;
    throw new ApiError(error instanceof Error ? error.message : 'Failed to delete reading record');
  }
}
