CREATE TABLE IF NOT EXISTS program_events (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  sheet_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_program_events_created_at ON program_events(created_at DESC);