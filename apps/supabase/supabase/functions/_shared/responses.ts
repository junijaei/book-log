import { corsHeaders } from './constants.ts';

export function corsResponse(): Response {
  return new Response('ok', { headers: corsHeaders });
}

export function errorResponse(message: string, status = 400): Response {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function successResponse(data: unknown = undefined, meta?: unknown): Response {
  const body = meta !== undefined ? { data, meta } : { data };
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

export function createdResponse(data: unknown): Response {
  return new Response(JSON.stringify({ data }), {
    status: 201,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
