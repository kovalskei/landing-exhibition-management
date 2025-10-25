-- Создаем таблицу для хранения планов пользователей
CREATE TABLE IF NOT EXISTS t_p73504605_landing_exhibition_m.user_plans (
    id SERIAL PRIMARY KEY,
    event_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    session_ids TEXT[] NOT NULL,
    created_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Индекс для быстрого поиска планов по event_id
CREATE INDEX idx_user_plans_event_id ON t_p73504605_landing_exhibition_m.user_plans(event_id);

-- Индекс для быстрого поиска планов конкретного пользователя
CREATE INDEX idx_user_plans_user_event ON t_p73504605_landing_exhibition_m.user_plans(user_id, event_id);

-- Таблица для хранения агрегированной статистики по сессиям
CREATE TABLE IF NOT EXISTS t_p73504605_landing_exhibition_m.session_stats (
    event_id TEXT NOT NULL,
    session_id TEXT NOT NULL,
    interest_count INTEGER DEFAULT 0,
    updated_at TIMESTAMP WITHOUT TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, session_id)
);

-- Индекс для быстрого получения статистики по event_id
CREATE INDEX idx_session_stats_event_id ON t_p73504605_landing_exhibition_m.session_stats(event_id);

COMMENT ON TABLE t_p73504605_landing_exhibition_m.user_plans IS 'Планы докладов пользователей';
COMMENT ON TABLE t_p73504605_landing_exhibition_m.session_stats IS 'Агрегированная статистика интереса к докладам';