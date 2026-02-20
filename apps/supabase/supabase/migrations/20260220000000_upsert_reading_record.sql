-- =============================================================================
-- Migration: upsert_reading_record
--
-- Adds a single transactional stored procedure that atomically handles:
--   - Book upsert
--   - ReadingLog insert / update (with ownership check)
--   - Quotes  insert / update / delete
--   - Reviews insert / update / delete
--
-- PostgreSQL wraps every PL/pgSQL function call inside an implicit transaction,
-- so any RAISE or unhandled error rolls back all changes in this call.
--
-- Called from the reading-records Edge Function via supabase.rpc().
-- =============================================================================

CREATE OR REPLACE FUNCTION public.upsert_reading_record(
  p_user_id UUID,
  p_payload  JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  -- Payload sections
  v_book    JSONB := p_payload -> 'book';
  v_log     JSONB := p_payload -> 'reading_log';
  v_quotes  JSONB := COALESCE(p_payload -> 'quotes',  '[]'::JSONB);
  v_reviews JSONB := COALESCE(p_payload -> 'reviews', '[]'::JSONB);

  -- Resolved IDs
  v_book_id        UUID;
  v_reading_log_id UUID;
  v_existing_user  UUID;

  -- Delete arrays
  v_delete_quote_ids  UUID[];
  v_delete_review_ids UUID[];
BEGIN

  -- ── Parse delete-ID arrays ─────────────────────────────────────────────────
  --
  -- Safely converts the JSON string arrays into UUID arrays.
  -- The WHERE clause guards against missing or empty keys so the SELECT INTO
  -- leaves the variable NULL when there is nothing to delete.

  SELECT ARRAY(
    SELECT jsonb_array_elements_text(p_payload -> 'delete_quote_ids')::UUID
  )
  INTO v_delete_quote_ids
  WHERE (p_payload -> 'delete_quote_ids') IS NOT NULL
    AND jsonb_array_length(p_payload -> 'delete_quote_ids') > 0;

  SELECT ARRAY(
    SELECT jsonb_array_elements_text(p_payload -> 'delete_review_ids')::UUID
  )
  INTO v_delete_review_ids
  WHERE (p_payload -> 'delete_review_ids') IS NOT NULL
    AND jsonb_array_length(p_payload -> 'delete_review_ids') > 0;

  -- ── Book ───────────────────────────────────────────────────────────────────
  --
  -- If an id is supplied → UPDATE (user owns the row).
  -- Otherwise → INSERT and capture the generated id.

  IF v_book IS NOT NULL THEN
    v_book_id := (v_book ->> 'id')::UUID;

    IF v_book_id IS NOT NULL THEN
      UPDATE books
      SET
        title           = v_book ->> 'title',
        author          = v_book ->> 'author',
        cover_image_url = v_book ->> 'cover_image_url',
        total_pages     = (v_book ->> 'total_pages')::INTEGER,
        updated_at      = NOW()
      WHERE id = v_book_id
        AND user_id = p_user_id;
    ELSE
      INSERT INTO books (title, author, cover_image_url, total_pages, user_id)
      VALUES (
        v_book ->> 'title',
        v_book ->> 'author',
        v_book ->> 'cover_image_url',
        (v_book ->> 'total_pages')::INTEGER,
        p_user_id
      )
      RETURNING id INTO v_book_id;
    END IF;
  END IF;

  -- ── Reading Log ────────────────────────────────────────────────────────────
  --
  -- UPDATE when id present (ownership-checked), INSERT when not.

  IF v_log IS NOT NULL THEN
    v_reading_log_id := (v_log ->> 'id')::UUID;

    IF v_reading_log_id IS NOT NULL THEN
      -- Ownership check — raise so the whole transaction rolls back
      SELECT user_id INTO v_existing_user
      FROM reading_logs
      WHERE id = v_reading_log_id;

      IF NOT FOUND OR v_existing_user IS DISTINCT FROM p_user_id THEN
        RAISE EXCEPTION 'Reading log not found or not owned by you'
          USING ERRCODE = 'P0001';
      END IF;

      UPDATE reading_logs
      SET
        status       = (v_log ->> 'status')::reading_status,
        current_page = (v_log ->> 'current_page')::INTEGER,
        rating       = (v_log ->> 'rating')::INTEGER,
        start_date   = (v_log ->> 'start_date')::DATE,
        end_date     = (v_log ->> 'end_date')::DATE,
        review       = v_log ->> 'review',
        visibility   = (v_log ->> 'visibility')::visibility,
        book_id      = COALESCE(v_book_id, book_id),
        updated_at   = NOW()
      WHERE id = v_reading_log_id;

    ELSE
      INSERT INTO reading_logs (
        book_id, status, current_page, rating,
        start_date, end_date, review, visibility, user_id
      )
      VALUES (
        v_book_id,
        COALESCE((v_log ->> 'status')::reading_status, 'want_to_read'),
        (v_log ->> 'current_page')::INTEGER,
        (v_log ->> 'rating')::INTEGER,
        (v_log ->> 'start_date')::DATE,
        (v_log ->> 'end_date')::DATE,
        v_log ->> 'review',
        COALESCE((v_log ->> 'visibility')::visibility, 'public'),
        p_user_id
      )
      RETURNING id INTO v_reading_log_id;
    END IF;
  END IF;

  -- ── Quotes: insert new (no id in payload) ──────────────────────────────────

  INSERT INTO quotes (reading_log_id, text, page_number, noted_at, user_id)
  SELECT
    v_reading_log_id,
    (q ->> 'text'),
    (q ->> 'page_number')::INTEGER,
    (q ->> 'noted_at')::DATE,
    p_user_id
  FROM jsonb_array_elements(v_quotes) AS q
  WHERE q ->> 'id' IS NULL
    AND (q ->> 'text') IS NOT NULL;

  -- ── Quotes: update existing (has id in payload) ────────────────────────────

  UPDATE quotes AS tgt
  SET
    text        = src ->> 'text',
    page_number = (src ->> 'page_number')::INTEGER,
    noted_at    = (src ->> 'noted_at')::DATE
  FROM jsonb_array_elements(v_quotes) AS src
  WHERE tgt.id      = (src ->> 'id')::UUID
    AND tgt.user_id = p_user_id
    AND src ->> 'id' IS NOT NULL;

  -- ── Quotes: delete ─────────────────────────────────────────────────────────

  IF v_delete_quote_ids IS NOT NULL THEN
    DELETE FROM quotes
    WHERE id = ANY(v_delete_quote_ids)
      AND user_id = p_user_id;
  END IF;

  -- ── Reviews: insert new (no id in payload) ─────────────────────────────────

  INSERT INTO reviews (reading_log_id, content, page_number, reviewed_at, user_id)
  SELECT
    v_reading_log_id,
    (r ->> 'content'),
    (r ->> 'page_number')::INTEGER,
    (r ->> 'reviewed_at')::DATE,
    p_user_id
  FROM jsonb_array_elements(v_reviews) AS r
  WHERE r ->> 'id' IS NULL
    AND (r ->> 'content') IS NOT NULL;

  -- ── Reviews: update existing (has id in payload) ───────────────────────────

  UPDATE reviews AS tgt
  SET
    content     = src ->> 'content',
    page_number = (src ->> 'page_number')::INTEGER,
    reviewed_at = (src ->> 'reviewed_at')::DATE,
    updated_at  = NOW()
  FROM jsonb_array_elements(v_reviews) AS src
  WHERE tgt.id      = (src ->> 'id')::UUID
    AND tgt.user_id = p_user_id
    AND src ->> 'id' IS NOT NULL;

  -- ── Reviews: delete ────────────────────────────────────────────────────────

  IF v_delete_review_ids IS NOT NULL THEN
    DELETE FROM reviews
    WHERE id = ANY(v_delete_review_ids)
      AND user_id = p_user_id;
  END IF;

  -- ── Return resolved IDs ────────────────────────────────────────────────────

  RETURN jsonb_build_object(
    'book_id',        v_book_id,
    'reading_log_id', v_reading_log_id
  );

END;
$$;

-- Grant execute permission to authenticated users (called via service role in Edge Function)
GRANT EXECUTE ON FUNCTION public.upsert_reading_record(UUID, JSONB) TO authenticated;
