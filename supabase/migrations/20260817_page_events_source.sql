-- utm_source/src 쿼리 파라미터로 잡은 유입경로. 없으면 null(추후 referrer로 폴백해서
-- 집계). 기존 행은 전부 null — 소급 계산 안 함.
alter table public.page_events add column if not exists source text;
