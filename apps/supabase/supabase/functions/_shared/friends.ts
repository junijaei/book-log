import { SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2';

export async function getFriendIds(supabase: SupabaseClient, userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'accepted')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error || !data) return [];

  return data.map((row: { requester_id: string; addressee_id: string }) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id
  );
}

export async function getBlockedUserIds(
  supabase: SupabaseClient,
  userId: string
): Promise<string[]> {
  const { data, error } = await supabase
    .from('friendships')
    .select('requester_id, addressee_id')
    .eq('status', 'blocked')
    .or(`requester_id.eq.${userId},addressee_id.eq.${userId}`);

  if (error || !data) return [];

  return data.map((row: { requester_id: string; addressee_id: string }) =>
    row.requester_id === userId ? row.addressee_id : row.requester_id
  );
}
