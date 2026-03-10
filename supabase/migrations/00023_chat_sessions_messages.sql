-- M4: AI Chat Sessions & Messages
-- Chat sessions link a conversation to a trip itinerary
-- Chat messages store the full conversation history with typed messages

-- ============================================================
-- 1. chat_sessions
-- ============================================================
CREATE TABLE IF NOT EXISTS public.chat_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  itinerary_id  UUID REFERENCES public.itineraries(id) ON DELETE SET NULL,
  title         TEXT,                         -- optional label, e.g. "Tokyo Trip Planning"
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_sessions_user ON public.chat_sessions(user_id);
CREATE INDEX idx_chat_sessions_itinerary ON public.chat_sessions(itinerary_id);

-- RLS
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat sessions"
  ON public.chat_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat sessions"
  ON public.chat_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chat sessions"
  ON public.chat_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own chat sessions"
  ON public.chat_sessions FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================================
-- 2. chat_messages
-- ============================================================
CREATE TYPE public.chat_message_type AS ENUM (
  'text',
  'trip_form',
  'trip_summary',
  'itinerary_result',
  'error'
);

CREATE TABLE IF NOT EXISTS public.chat_messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id    UUID NOT NULL REFERENCES public.chat_sessions(id) ON DELETE CASCADE,
  role          TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content       TEXT NOT NULL DEFAULT '',
  message_type  public.chat_message_type NOT NULL DEFAULT 'text',
  metadata      JSONB,                        -- form data, itinerary snapshot, etc.
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_chat_messages_session ON public.chat_messages(session_id);
CREATE INDEX idx_chat_messages_created ON public.chat_messages(session_id, created_at);

-- RLS (access via session ownership)
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own chat messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND cs.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own chat messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_sessions cs
      WHERE cs.id = chat_messages.session_id
        AND cs.user_id = auth.uid()
    )
  );

-- ============================================================
-- 3. Add budget column to itineraries
-- ============================================================
ALTER TABLE public.itineraries
  ADD COLUMN IF NOT EXISTS budget TEXT CHECK (budget IN ('budget-friendly', 'mid-range', 'premium', 'luxury'));

-- ============================================================
-- 4. updated_at trigger for chat_sessions
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_chat_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.chat_sessions
  SET updated_at = now()
  WHERE id = NEW.session_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_chat_message_update_session
  AFTER INSERT ON public.chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_chat_session_timestamp();
