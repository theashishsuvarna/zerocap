/*
# Portfolio Items Table

## Overview
Adds a `portfolio_items` table for creators to showcase their past work/projects,
separate from gigs. Each portfolio item has a title, description, image, project link,
and skills used.

## Table
- `portfolio_items`
  - `id` (uuid, primary key)
  - `creator_id` (uuid, FK to profiles, ON DELETE CASCADE)
  - `title` (text, not null)
  - `description` (text)
  - `image_url` (text) — public URL from the previews bucket or external
  - `project_link` (text) — external link to the project
  - `skills_used` (text[]) — skills demonstrated in this project
  - `created_at` (timestamp)
  - `updated_at` (timestamp)

## Security
- RLS enabled.
- Public read (anyone can view portfolio items).
- Only the creator can insert/update/delete their own portfolio items.
*/

CREATE TABLE IF NOT EXISTS portfolio_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text DEFAULT '',
  image_url text,
  project_link text,
  skills_used text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE portfolio_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "portfolio_items_select_public" ON portfolio_items;
CREATE POLICY "portfolio_items_select_public" ON portfolio_items FOR SELECT
  TO authenticated USING (true);

DROP POLICY IF EXISTS "portfolio_items_insert_own" ON portfolio_items;
CREATE POLICY "portfolio_items_insert_own" ON portfolio_items FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "portfolio_items_update_own" ON portfolio_items;
CREATE POLICY "portfolio_items_update_own" ON portfolio_items FOR UPDATE
  TO authenticated USING (auth.uid() = creator_id) WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "portfolio_items_delete_own" ON portfolio_items;
CREATE POLICY "portfolio_items_delete_own" ON portfolio_items FOR DELETE
  TO authenticated USING (auth.uid() = creator_id);

CREATE INDEX IF NOT EXISTS idx_portfolio_items_creator ON portfolio_items(creator_id);

DROP TRIGGER IF EXISTS trg_portfolio_items_updated ON portfolio_items;
CREATE TRIGGER trg_portfolio_items_updated BEFORE UPDATE ON portfolio_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
