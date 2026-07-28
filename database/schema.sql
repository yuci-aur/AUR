CREATE TABLE IF NOT EXISTS aur_universities (
  id text PRIMARY KEY,
  name text NOT NULL,
  location text NOT NULL DEFAULT '',
  overall double precision,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS aur_universities_order_idx
  ON aur_universities (overall DESC NULLS LAST, id ASC);

CREATE INDEX IF NOT EXISTS aur_universities_name_idx
  ON aur_universities (name);

CREATE TABLE IF NOT EXISTS aur_blogs (
  id text PRIMARY KEY,
  title text NOT NULL,
  slug text NOT NULL,
  category text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'draft',
  description text NOT NULL DEFAULT '',
  content text NOT NULL DEFAULT '',
  cover_image text,
  author text,
  read_time text,
  tags text,
  featured boolean NOT NULL DEFAULT false,
  publish_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS aur_blogs_slug_idx ON aur_blogs (slug);
CREATE INDEX IF NOT EXISTS aur_blogs_status_created_idx
  ON aur_blogs (status, created_at DESC);

CREATE TABLE IF NOT EXISTS aur_events (
  id text PRIMARY KEY,
  title text NOT NULL,
  description text,
  type text NOT NULL CHECK (type IN ('event', 'award')),
  eligibility_criteria text,
  deadline timestamptz,
  status text NOT NULL DEFAULT 'open'
    CHECK (status IN ('open', 'closed', 'archived')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS aur_events_type_created_idx
  ON aur_events (type, created_at);

CREATE TABLE IF NOT EXISTS aur_user_profiles (
  firebase_uid text PRIMARY KEY,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  last_name text NOT NULL DEFAULT '',
  country text NOT NULL DEFAULT '',
  profile_role text NOT NULL DEFAULT 'Student',
  profile_photo text,
  account_type text NOT NULL DEFAULT 'student'
    CHECK (account_type IN ('student', 'institution')),
  institution_application_status text NOT NULL DEFAULT '',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS aur_user_profiles_email_idx
  ON aur_user_profiles (lower(email));

CREATE TABLE IF NOT EXISTS aur_admin_profiles (
  firebase_uid text PRIMARY KEY,
  email text NOT NULL,
  first_name text NOT NULL DEFAULT 'AUR',
  last_name text NOT NULL DEFAULT 'Admin',
  role text NOT NULL DEFAULT 'admin',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aur_institution_applications (
  firebase_uid text PRIMARY KEY REFERENCES aur_user_profiles(firebase_uid) ON DELETE CASCADE,
  institution_name text NOT NULL,
  institution_type text NOT NULL,
  country text NOT NULL,
  website text NOT NULL,
  accreditation_id text NOT NULL,
  representative_name text NOT NULL,
  representative_email text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('draft', 'pending', 'approved', 'rejected')),
  submitted_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aur_bookmarks (
  firebase_uid text NOT NULL REFERENCES aur_user_profiles(firebase_uid) ON DELETE CASCADE,
  university_id text NOT NULL REFERENCES aur_universities(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (firebase_uid, university_id)
);

CREATE TABLE IF NOT EXISTS aur_newsletter_subscribers (
  email text PRIMARY KEY,
  active boolean NOT NULL DEFAULT true,
  subscribed_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS aur_applications (
  id text PRIMARY KEY,
  firebase_uid text,
  event_id text,
  university_id text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'submitted',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS aur_nominations (
  id text PRIMARY KEY,
  firebase_uid text,
  status text NOT NULL DEFAULT 'pending_review',
  submitted_at timestamptz NOT NULL DEFAULT now(),
  data jsonb NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS aur_content_documents (
  collection_name text NOT NULL,
  id text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (collection_name, id)
);

CREATE INDEX IF NOT EXISTS aur_content_documents_collection_idx
  ON aur_content_documents (collection_name, created_at DESC);
