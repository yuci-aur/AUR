-- Institution registration → public "Registered Institutions" listing.
--
-- Adds the listing/media fields the registration form now collects, plus the
-- audit trail written when an admin approves or rejects an application.
-- Safe to run more than once.

ALTER TABLE aur_institution_applications
  ADD COLUMN IF NOT EXISTS description text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS campus_photo text,
  ADD COLUMN IF NOT EXISTS reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by text,
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- The public listing filters on status and orders by name.
CREATE INDEX IF NOT EXISTS aur_institution_applications_status_idx
  ON aur_institution_applications (status, institution_name);
