-- subscriptions.source — 어느 스토어에서 결제됐는지.
--
-- 왜 지금 추가하나: 앱 안에서 산 구독을 기록하는 클라이언트 upsert 가 2026-05-27
-- (Apple IAP 도입, 9706de4c) 부터 이 컬럼을 써 왔는데 **테이블에는 없었다.**
-- PostgREST 는 없는 컬럼이 오면 42703 으로 요청 전체를 거부한다. 그리고
-- supabase-js 는 에러를 throw 하지 않고 반환만 하는데 클라이언트가 그 반환값을
-- 확인하지 않아서, 결제는 스토어에서 성사되고 구독 행은 전혀 안 써지는데
-- 화면은 성공한 것처럼 닫혔다. iOS·안드로이드 인앱 결제가 둘 다 이 모양이었다.
--
-- ⚠️ 이 마이그레이션을 적용하면 **이미 스토어에 올라간 빌드가 새 빌드 없이 고쳐진다.**
-- 컬럼이 없던 것이 유일한 실패 원인이었기 때문이다.

alter table public.subscriptions
  add column if not exists source text;

-- 지금 있는 행을 쓴 것은 둘 중 하나다: Stripe 웹훅(api/stripe-webhook.ts) 또는
-- 어드민 화면(api/admin-update-plan.ts, 수동 부여). 인앱 결제는 위 이유로 한 번도
-- 행을 쓰지 못했으므로 'apple'/'google' 인 행은 존재할 수 없다.
-- stripe_subscription_id 유무로 둘을 가른다 — 전부 'stripe' 라고 칠하면 거짓이 된다.
update public.subscriptions
   set source = case when stripe_subscription_id is not null then 'stripe' else 'admin' end
 where source is null;

alter table public.subscriptions
  alter column source set default 'stripe';

comment on column public.subscriptions.source is
  'stripe | apple | google — 결제가 성사된 스토어. 환불 응대와 스토어별 매출 대조에 쓴다.';

-- 📌 남은 꼬리: api/admin-update-plan.ts 는 source 를 쓰지 않으므로 앞으로 어드민이
-- 부여하는 행도 기본값 'stripe' 가 된다. 거기에 source:'admin' 을 넣는 건 이 SQL 이
-- 적용된 뒤에 해야 한다(컬럼이 없는 상태에서 배포하면 어드민 화면이 깨진다).
