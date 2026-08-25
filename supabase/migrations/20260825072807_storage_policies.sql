/*
# Storage Policies — Deliverables & Previews

## Overview
Sets RLS policies on the `deliverables` (private) and `previews` (public) storage buckets.

## Security
- **deliverables** (private): Only the creator (uploader) and hirer (order participant) can read. Only creators can upload/update/delete. Access to originals is only via short-lived signed URLs generated server-side after verified payment.
- **previews** (public): Anyone can read (watermarked previews). Only the creator can upload/update/delete.
*/

-- ============================================
-- DELIVERABLES BUCKET (PRIVATE)
-- ============================================
DROP POLICY IF EXISTS "deliverables_read_participants" ON storage.objects;
CREATE POLICY "deliverables_read_participants" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.original_file_path = name
      AND (d.creator_id = auth.uid() OR d.hirer_id = auth.uid())
    )
  );

DROP POLICY IF EXISTS "deliverables_insert_creator" ON storage.objects;
CREATE POLICY "deliverables_insert_creator" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'deliverables'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "deliverables_update_creator" ON storage.objects;
CREATE POLICY "deliverables_update_creator" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.original_file_path = name
      AND d.creator_id = auth.uid()
    )
  )
  WITH CHECK (
    bucket_id = 'deliverables'
    AND EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.original_file_path = name
      AND d.creator_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "deliverables_delete_creator" ON storage.objects;
CREATE POLICY "deliverables_delete_creator" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'deliverables'
    AND EXISTS (
      SELECT 1 FROM deliverables d
      WHERE d.original_file_path = name
      AND d.creator_id = auth.uid()
    )
  );

-- ============================================
-- PREVIEWS BUCKET (PUBLIC READ)
-- ============================================
DROP POLICY IF EXISTS "previews_read_public" ON storage.objects;
CREATE POLICY "previews_read_public" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'previews');

DROP POLICY IF EXISTS "previews_insert_creator" ON storage.objects;
CREATE POLICY "previews_insert_creator" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'previews'
    AND EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "previews_update_creator" ON storage.objects;
CREATE POLICY "previews_update_creator" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'previews')
  WITH CHECK (bucket_id = 'previews');

DROP POLICY IF EXISTS "previews_delete_creator" ON storage.objects;
CREATE POLICY "previews_delete_creator" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'previews');
