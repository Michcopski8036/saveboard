// The accent strip that runs along the top of a card — saved links, blog posts
// and guides all use this one, so they read as the same product.
//
// Stop positions, not just colours, are the design here: a touch of the brand
// blue at the very start, purple holding most of the bar, and the coral/orange
// compressed into the last stretch. Changing the percentages changes the look
// as much as changing the hexes would.
// Purple is held flat from 7% to 78% rather than blended the whole way across —
// a straight purple-to-coral blend turns the right half pink long before the
// coral stop, which reads as much less purple than the numbers suggest.
export const CARD_STRIP_GRADIENT =
  'linear-gradient(to right, #1ABCFE 0%, #A259FF 7%, #A259FF 78%, #FF7262 97%, #F24E1E 100%)';
