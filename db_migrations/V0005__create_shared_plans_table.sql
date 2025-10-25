-- Создаём таблицу для расшаренных планов мероприятий
CREATE TABLE IF NOT EXISTS shared_plans (
  plan_id TEXT PRIMARY KEY,
  session_ids TEXT[] NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);