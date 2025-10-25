-- Таблица для кеширования данных программы из Google Sheets
CREATE TABLE IF NOT EXISTS program_cache (
    event_id TEXT NOT NULL,
    sheet_gid TEXT NOT NULL,
    data JSONB NOT NULL,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (event_id, sheet_gid)
);

-- Индекс для быстрого поиска по event_id
CREATE INDEX IF NOT EXISTS idx_program_cache_event ON program_cache(event_id);

-- Индекс для поиска устаревших записей
CREATE INDEX IF NOT EXISTS idx_program_cache_updated ON program_cache(last_updated);