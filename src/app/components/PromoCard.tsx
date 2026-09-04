import { ArrowRight } from 'lucide-react';

/**
 * The own-app promo card, shared by guides and blog/landing pages. Both read the
 * same `promo_*` frontmatter, so both render the same card — extracted from
 * GuidePostPage unchanged so the guides keep the design signed off on 2026-09-04.
 *
 * ⛔ Design is settled. The two things that must not drift:
 *   - `rose` (mauve #8A5A6B) is **PeriodVol only**; everything else takes the
 *     SaveBoard/CourtClock purple. They were unified once and reverted.
 *   - Cards with and without an image sit side by side on purpose.
 */
export interface PromoFields {
  promoNote: string;
  promoTitle: string;
  promoText: string;
  promoCta: string;
  promoUrl: string;
  promoImage: string;
  promoImageAlt: string;
  promoImageW: string;
  promoImageH: string;
  promoFine: string;
  promoTheme: string;
}

/**
 * Promo card palettes, keyed by `promo_theme` frontmatter. `default` is the
 * SaveBoard purple used by the CourtClock banner; `rose` is PeriodVol's
 * rose/mauve tokens (bg #FBF7F4 / rose #F6E2DD / mauve #8A5A6B / blood #D23B26)
 * so the two brands don't wear the same jacket.
 */
export const PROMO_THEMES: Record<string, { card: string; imgCol: string; eyebrow: string; cta: string }> = {
  default: {
    card: 'bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200 shadow-purple-100',
    imgCol: 'bg-[#171310]',
    eyebrow: 'text-purple-600',
    cta: 'bg-gradient-to-r from-[#A259FF] to-[#FF7262] shadow-purple-200',
  },
  rose: {
    card: 'bg-gradient-to-br from-[#FBF7F4] to-[#F6E2DD] border-[#EBDED7] shadow-rose-100',
    imgCol: 'bg-[#FBF7F4]',
    eyebrow: 'text-[#8A5A6B]',
    cta: 'bg-gradient-to-r from-[#D23B26] to-[#8A5A6B] shadow-rose-200',
  },
};

/** True when a page carries enough frontmatter to show a card at all. */
export function hasPromoCard(promo: Partial<PromoFields> | undefined): boolean {
  return Boolean(promo?.promoUrl && promo?.promoText);
}

export function PromoCard({ promo, ko }: { promo: PromoFields; ko: boolean }) {
  const theme = PROMO_THEMES[promo.promoTheme] ?? PROMO_THEMES.default;

  return (
    <aside aria-label={ko ? '광고' : 'Advertisement'} className="my-9">
      {/* 카드 전체가 하나의 클릭 대상이다 — 예전에는 이미지와 버튼만 눌렸고 제목·본문은
          죽은 영역이었다(폰에서 카드 대부분이 그 영역이었다). 그래서 바깥을 <a>로 감싸고
          CTA는 <span>으로 둔다 — <a> 안에 <a>는 넣을 수 없다. 스크린리더가 카드 전문을
          링크 이름으로 읽지 않도록 aria-label 로 CTA 문구만 준다.
          ⚠️ 이 마크업은 scripts/prerender-seo.mjs 의 프로모 카드와 짝이다. 한쪽만 고치면
          검색로봇이 보는 것과 사람이 보는 것이 갈린다(2026-09-05에 실제로 갈려 있었다). */}
      <a
        href={promo.promoUrl}
        aria-label={promo.promoCta}
        className={`block rounded-2xl overflow-hidden border-2 no-underline text-inherit ${theme.card}`}
      >
        {/* 세로 스크린샷은 620px부터 좌우, 그 아래는 위아래로 쌓는다. 자르지 않는다
            (no object-cover) — 스크린샷의 위→아래 순서가 곧 설명이기 때문이다. */}
        <span className="flex flex-col min-[620px]:flex-row">
          {promo.promoImage && (
            <span
              className={`block shrink-0 min-[620px]:w-[45%] min-[620px]:max-w-[320px] min-[620px]:flex min-[620px]:items-center ${theme.imgCol}`}
            >
              <img
                src={promo.promoImage}
                alt={promo.promoImageAlt}
                width={Number(promo.promoImageW) || undefined}
                height={Number(promo.promoImageH) || undefined}
                loading="lazy"
                /* 좁은 폭에서 세로로 너무 자라 본문을 막던 것을 상한으로 막는다. */
                className="block h-auto max-h-[420px] w-auto mx-auto min-[620px]:max-h-none min-[620px]:w-full"
              />
            </span>
          )}
          <span className="block p-6 sm:p-8 min-[620px]:flex min-[620px]:flex-col min-[620px]:justify-center">
            <span className={`block text-[12px] font-bold uppercase tracking-wider mb-2 ${theme.eyebrow}`}>
              {promo.promoNote}
            </span>
            {/* 제목이지만 <h2>가 아니다. 광고 문구가 문서 아웃라인에 들어가면 제목 단위로
                훑는 독자·스크린리더에게 글의 한 섹션으로 읽힌다. 크기도 본문 H2(24px/700)
                보다 한 단계 아래로 둔다 — 이 글의 상품은 신뢰이고, 광고가 콘텐츠보다 높은
                계급을 가지면 안 된다. */}
            {promo.promoTitle && (
              <span className="block text-[19px] sm:text-[21px] font-bold text-gray-900 leading-tight mb-3">
                {promo.promoTitle}
              </span>
            )}
            <span className="block text-[15px] text-gray-600 leading-relaxed mb-6">
              {promo.promoText}
            </span>
            <span
              className={`flex min-[620px]:inline-flex items-center justify-center gap-2 px-8 py-4 text-white rounded-2xl font-bold text-[16px] [text-shadow:0_1px_2px_rgba(0,0,0,.35)] shadow-lg self-start w-full min-[620px]:w-auto ${theme.cta}`}
            >
              {promo.promoCta}
              <ArrowRight className="w-5 h-5" />
            </span>
            {/* gray-400은 이 카드 배경에서 2.4:1 — 광고임을 밝히는 문장이 페이지에서
                가장 안 보이는 글자였다. gray-600은 7.0:1. */}
            {promo.promoFine && (
              <span className="block text-[12px] text-gray-600 mt-4">{promo.promoFine}</span>
            )}
          </span>
        </span>
      </a>
    </aside>
  );
}

/** Splits a body at its first H2 so the promo card can sit right after the intro. */
export function splitAtFirstSection(md: string): [string, string] {
  const match = md.match(/\n(?=##\s)/);
  if (!match || match.index === undefined) return [md, ''];
  return [md.slice(0, match.index).trim(), md.slice(match.index).trim()];
}
