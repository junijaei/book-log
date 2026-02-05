/**
 * Edge Functions Client
 *
 * Helper for making authenticated requests to Supabase Edge Functions.
 * Uses supabase.functions.invoke() which automatically attaches the JWT.
 */

import { supabase } from '@/lib/supabase';
import { ApiError, type EdgeFunctionErrorResponse } from './errors';
import {
  FunctionsHttpError,
  FunctionsRelayError,
  FunctionsFetchError,
} from '@supabase/supabase-js';

/**
 * Makes an authenticated request to a Supabase Edge Function.
 * The SDK automatically includes the current user's JWT token.
 *
 * @param functionName - The name of the Edge Function to call
 * @param options - Options including method, body, headers
 * @returns The parsed JSON response
 * @throws {ApiError} If the request fails or returns an error
 */
export async function invokeEdgeFunction<TResponse>(
  functionName: string,
  options: {
    method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
    body?: unknown;
    headers?: Record<string, string>;
  } = {}
): Promise<TResponse> {
  const { method = 'POST', body, headers = {} } = options;

  const { data, error } = await supabase.functions.invoke<TResponse>(functionName, {
    method,
    body: body as Record<string, unknown> | undefined,
    headers,
  });

  if (error) {
    // Handle different error types from Supabase Functions
    if (error instanceof FunctionsHttpError) {
      let errorData: EdgeFunctionErrorResponse = {};
      try {
        errorData = (await error.context.json()) as EdgeFunctionErrorResponse;
      } catch {
        // If parsing fails, use the error message
      }
      throw new ApiError(
        errorData?.message || errorData?.error || error.message,
        error.context.status,
        errorData?.code,
        errorData
      );
    } else if (error instanceof FunctionsRelayError) {
      throw new ApiError(error.message, 500, 'RELAY_ERROR', error);
    } else if (error instanceof FunctionsFetchError) {
      throw new ApiError(error.message, 0, 'FETCH_ERROR', error);
    } else {
      throw new ApiError(error.message, undefined, undefined, error);
    }
  }

  return data as TResponse;
}
