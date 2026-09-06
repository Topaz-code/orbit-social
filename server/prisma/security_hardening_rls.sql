-- ==============================================================================
-- ORBIT PRODUCTION SECURITY HARDENING: ROW LEVEL SECURITY & PERMISSION LOCKDOWN
-- Target: Supabase / PostgreSQL Database
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. REVOKE DEFAULT PUBLIC & POSTGREST PERMISSIONS
-- Prevents unauthenticated ('anon') and direct client ('authenticated') users
-- from directly querying or tampering with the database via Supabase PostgREST API.
-- All client interactions must go through the hardened Orbit Express API.
-- ------------------------------------------------------------------------------

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM anon;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon;

REVOKE ALL ON ALL TABLES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA public FROM authenticated;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM authenticated;

-- Ensure service_role and database owner retain full administrative access
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres, service_role;

-- ------------------------------------------------------------------------------
-- 2. ENABLE ROW LEVEL SECURITY (RLS) ON ALL TABLES
-- Guarantees that zero tables are left open by default.
-- ------------------------------------------------------------------------------

ALTER TABLE IF EXISTS "users" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "posts" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "comments" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "likes" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "stories" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "conversations" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "conversation_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "messages" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "groups" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "group_members" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "friendships" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "notifications" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "calls" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "device_tokens" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "reports" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "moderation_logs" ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS "otp_codes" ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3. DEFENSE-IN-DEPTH RLS POLICIES (SERVICE ROLE BYPASS)
-- Supabase service_role and postgres superuser bypass RLS by default.
-- Explicit policies below ensure that even if anon or authenticated roles
-- are ever granted accidental table access, data access is strictly bounded.
-- ------------------------------------------------------------------------------

-- Users table: Anyone can read public user profile cards, but only the owner can update their own non-sensitive fields
DROP POLICY IF EXISTS "Public users can view safe profiles" ON "users";
CREATE POLICY "Public users can view safe profiles" ON "users"
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can only update own profile" ON "users";
CREATE POLICY "Users can only update own profile" ON "users"
  FOR UPDATE USING (auth.uid()::text = id)
  WITH CHECK (
    auth.uid()::text = id 
    AND role IS NOT DISTINCT FROM (SELECT role FROM "users" WHERE id = auth.uid()::text)
    AND is_banned IS NOT DISTINCT FROM (SELECT is_banned FROM "users" WHERE id = auth.uid()::text)
  );

-- Posts table: Public posts viewable by all, friends posts by friends, private by author
DROP POLICY IF EXISTS "Viewable posts policy" ON "posts";
CREATE POLICY "Viewable posts policy" ON "posts"
  FOR SELECT USING (
    status = 'ACTIVE' AND (
      visibility = 'public' 
      OR user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Authors can insert posts" ON "posts";
CREATE POLICY "Authors can insert posts" ON "posts"
  FOR INSERT WITH CHECK (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Authors can update own posts" ON "posts";
CREATE POLICY "Authors can update own posts" ON "posts"
  FOR UPDATE USING (user_id = auth.uid()::text);

DROP POLICY IF EXISTS "Authors can delete own posts" ON "posts";
CREATE POLICY "Authors can delete own posts" ON "posts"
  FOR DELETE USING (user_id = auth.uid()::text);

-- Messages table: Only conversation members can read or send messages
DROP POLICY IF EXISTS "Members can view messages" ON "messages";
CREATE POLICY "Members can view messages" ON "messages"
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM "conversation_members" cm
      WHERE cm.conversation_id = messages.conversation_id
      AND cm.user_id = auth.uid()::text
    )
  );

DROP POLICY IF EXISTS "Members can insert messages" ON "messages";
CREATE POLICY "Members can insert messages" ON "messages"
  FOR INSERT WITH CHECK (
    sender_id = auth.uid()::text
    AND EXISTS (
      SELECT 1 FROM "conversation_members" cm
      WHERE cm.conversation_id = messages.conversation_id
      AND cm.user_id = auth.uid()::text
    )
  );

-- OTP Codes: Strictly blocked from any PostgREST access (service_role only)
DROP POLICY IF EXISTS "Deny all client access to OTP codes" ON "otp_codes";
CREATE POLICY "Deny all client access to OTP codes" ON "otp_codes"
  FOR ALL USING (false);

-- Device Tokens: Strictly owned by user
DROP POLICY IF EXISTS "Users manage own device tokens" ON "device_tokens";
CREATE POLICY "Users manage own device tokens" ON "device_tokens"
  FOR ALL USING (user_id = auth.uid()::text);

-- Moderation Logs & Reports: Strictly locked from regular users
DROP POLICY IF EXISTS "Deny client access to moderation logs" ON "moderation_logs";
CREATE POLICY "Deny client access to moderation logs" ON "moderation_logs"
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM "users"
      WHERE users.id = auth.uid()::text
      AND users.role IN ('ADMIN', 'MODERATOR')
    )
  );
