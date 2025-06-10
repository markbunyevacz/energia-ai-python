-- This migration is now empty as the user_preferences table
-- is created in the 20250609232723_create_proactive_system_tables.sql migration.
-- Leaving the file here to maintain migration history integrity.

-- The CREATE TABLE statement below has been removed.

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at on row modification
CREATE TRIGGER set_user_preferences_timestamp
BEFORE UPDATE ON user_preferences
FOR EACH ROW
EXECUTE PROCEDURE trigger_set_timestamp();

COMMENT ON TABLE user_preferences IS 'Stores user-specific notification preferences.';
COMMENT ON COLUMN user_preferences.user_id IS 'Foreign key to the user this preference belongs to.';
COMMENT ON COLUMN user_preferences.email_notifications_enabled IS 'Enable/disable email notifications for the user.';
COMMENT ON COLUMN user_preferences.in_app_notifications_enabled IS 'Enable/disable in-app notifications for the user.'; 