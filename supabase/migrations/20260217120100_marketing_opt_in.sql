BEGIN;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS marketing_opt_in_at TIMESTAMPTZ;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id,
    display_name,
    primary_location_id,
    contact_email,
    marketing_opt_in,
    marketing_opt_in_at,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    CASE
      WHEN NEW.raw_user_meta_data->>'primary_location_id' IS NOT NULL
        AND NEW.raw_user_meta_data->>'primary_location_id' != ''
      THEN (NEW.raw_user_meta_data->>'primary_location_id')::UUID
      ELSE NULL
    END,
    NEW.email,
    CASE
      WHEN lower(coalesce(NEW.raw_user_meta_data->>'marketing_opt_in', 'false')) IN ('true', '1', 'yes')
      THEN true
      ELSE false
    END,
    CASE
      WHEN lower(coalesce(NEW.raw_user_meta_data->>'marketing_opt_in', 'false')) IN ('true', '1', 'yes')
      THEN COALESCE(NULLIF(NEW.raw_user_meta_data->>'marketing_opt_in_at', '')::TIMESTAMPTZ, now())
      ELSE NULL
    END,
    now(),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
