// @ts-nocheck -- this file runs on Supabase's Deno runtime, not our RN/Node project;
// the editor's TypeScript server doesn't know Deno's globals (Deno.serve, Deno.env,
// npm: specifiers) so it shows false-positive errors here. Deno type-checks this
// itself at deploy time.

// Copies one card (and its set) from TCGdex into our own catalog tables.
// The client sends only a card id — this function fetches and verifies the rest
// itself from TCGdex, so a modified client can't write arbitrary catalog data.

import { createClient } from 'npm:@supabase/supabase-js@2';

const TCGDEX_BASE = 'https://api.tcgdex.net/v2/en';
const CARD_ID_PATTERN = /^[a-zA-Z0-9-]+$/;

Deno.serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  const authHeader = req.headers.get('Authorization');
  if (!authHeader) {
    return json({ error: 'Missing Authorization header' }, 401);
  }

  // Verify the caller is an actual signed-in user (not just holding the public anon key).
  const userClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY')!,
    { global: { headers: { Authorization: authHeader } } }
  );
  const { data: userData, error: userError } = await userClient.auth.getUser();
  if (userError || !userData.user) {
    return json({ error: 'Not authenticated' }, 401);
  }

  let cardId: unknown;
  try {
    ({ cardId } = await req.json());
  } catch {
    return json({ error: 'Invalid JSON body' }, 400);
  }

  if (typeof cardId !== 'string' || !CARD_ID_PATTERN.test(cardId)) {
    return json({ error: 'Invalid cardId' }, 400);
  }

  const tcgdexRes = await fetch(`${TCGDEX_BASE}/cards/${encodeURIComponent(cardId)}`);
  if (!tcgdexRes.ok) {
    return json({ error: 'Card not found on TCGdex' }, 404);
  }
  const card = await tcgdexRes.json();

  if (card?.id !== cardId || !card?.name || !card?.set?.id || !card?.set?.name) {
    return json({ error: 'Unexpected TCGdex response shape' }, 502);
  }

  const adminClient = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { error: setError } = await adminClient.from('sets').upsert({
    id: card.set.id,
    name: card.set.name,
    card_count: card.set.cardCount?.official ?? card.set.cardCount?.total ?? null,
    logo_url: card.set.logo ?? null,
    symbol_url: card.set.symbol ?? null,
  });
  if (setError) {
    return json({ error: setError.message }, 500);
  }

  const { error: cardError } = await adminClient.from('cards').upsert({
    id: card.id,
    set_id: card.set.id,
    name: card.name,
    number: card.localId ?? null,
    rarity: card.rarity ?? null,
    image_url: card.image ?? null,
    types: card.types ?? [],
  });
  if (cardError) {
    return json({ error: cardError.message }, 500);
  }

  return json({ ok: true }, 200);
});

function json(body: unknown, status: number) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}
