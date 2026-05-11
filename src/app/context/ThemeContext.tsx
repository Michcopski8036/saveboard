import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

// ── Token shape ──────────────────────────────────────────────────────────────
export interface T {
  isDark: boolean;
  // Page
  pageBg: string; pageText: string;
  // Header
  headerBg: string; headerBorder: string;
  // Sidebar surface
  sidebarBg: string; sidebarBorder: string; sidebarShadow: string;
  logoDivider: string; logoText: string;
  logoIconBg: string; logoIconShadow: string; logoTextGradient: string;
  // Accent buttons (Add, FAB, modal, bottom nav +)
  accentBg: string; accentShadow: string; accentShadowHover: string; accentBgActive: string;
  // Cards
  cardBg: string; cardBorder: string; cardShadow: string;
  cardBorderHover: string; cardShadowHover: string;
  // Text hierarchy
  textPrimary: string; textSecondary: string; textMuted: string; textFaint: string;
  // Inputs (search, modal, board)
  inputBg: string; inputBorder: string; inputText: string;
  inputFocusBorder: string; inputFocusShadow: string; inputBlurBorder: string;
  // Interactive
  hoverBg: string;
  // Nav items
  navActiveBg: string; navActiveBorder: string; navActiveText: string;
  navActiveIconBg: string; navActiveIcon: string;
  navInactiveText: string; navInactiveIconBg: string; navInactiveIcon: string;
  navSectionLabel: string;
  // Board list (categories in sidebar)
  boardActiveBg: string; boardActiveBorder: string; boardActiveText: string;
  boardInactiveText: string; boardCountBg: string; boardCountText: string;
  boardInputBg: string; boardInputBorder: string; boardInputText: string;
  // Tags in sidebar
  tagBg: string; tagBorder: string; tagText: string;
  tagHoverBg: string; tagHoverBorder: string; tagHoverText: string;
  // Quick stats
  statCard1Bg: string; statCard1Border: string;
  statCard1Label: string; statCard1Number: string;
  // Badges / counts
  badgeBg: string; badgeText: string;
  // View / sort controls (header)
  controlContainerBg: string; controlContainerBorder: string;
  controlActiveBg: string; controlActiveColor: string; controlInactiveColor: string;
  selectBtnBg: string; selectBtnBorder: string; selectBtnText: string;
  selectBtnActiveBg: string; selectBtnActiveBorder: string; selectBtnActiveText: string;
  // Sort pills
  sortActiveBg: string; sortActiveText: string; sortInactiveText: string;
  // Accent / brand chips
  accentTagBg: string; accentTagBorder: string; accentTagText: string;
  accentChipBg: string; accentChipText: string; accentChipBorder: string;
  // Dropdown menu
  dropdownBg: string; dropdownBorder: string; dropdownShadow: string;
  dropdownText: string; dropdownIcon: string; dropdownHoverBg: string; dropdownDivider: string;
  // AI summary panel
  aiSummaryBg: string; aiSummaryBorder: string; aiSummaryText: string; aiSummaryLabel: string;
  aiTagBg: string; aiTagBorder: string; aiTagText: string;
  // Modal / notes overlay
  modalBg: string; modalBackdrop: string; modalBorder: string; modalShadow: string;
  modalTitle: string; modalSubtitle: string;
  modalInputBg: string; modalInputBorder: string; modalInputText: string;
  modalCloseBg: string; modalCloseText: string;
  modalPdfBg: string; modalPdfBorder: string; modalPdfText: string;
  // Floating bars (bulk delete, FAB)
  floatingBg: string; floatingBorder: string; floatingShadow: string; floatingText: string;
  fabSubLabelBg: string; fabSubLabelBorder: string; fabSubLabelText: string; fabSubLabelShadow: string;
  fabSubBtnBg: string; fabSubBtnBorder: string; fabSubBtnShadow: string; fabSubBtnIcon: string;
  fabSubBtnHoverBg: string;
  // Kanban
  kanbanColBg: string; kanbanColBorder: string; kanbanColDivider: string;
  kanbanCardBg: string; kanbanCardBorder: string; kanbanCardShadow: string;
  kanbanCardHoverShadow: string; kanbanCardHoverBorder: string;
  kanbanColTitle: string; kanbanColCountBg: string; kanbanColCountText: string;
  kanbanEmptyText: string;
  kanbanCatPillBg: string; kanbanCatPillText: string;
  kanbanActionHoverBg: string;
  // Icon colors
  iconAction: string; iconMuted: string;
  // Empty state
  emptyIconContainerBg: string; emptyIconContainerBorder: string; emptyIconColor: string;
  emptyTitle: string; emptySub: string;
  // Memo
  memoBg: string; memoText: string; memoGloss: string;
  // Search dropdown
  searchDropBg: string; searchDropBorder: string; searchDropShadow: string;
  searchDropItemText: string; searchDropItemHoverBg: string;
  searchDropIconBg: string; searchDropSecondary: string;
  searchDropFooterBorder: string; searchDropFooterText: string;
  // Mobile overlay
  mobileOverlay: string;
  // Bottom nav (mobile)
  bottomNavBg: string; bottomNavBorder: string; bottomNavShadow: string;
  bottomNavInactiveText: string;
}

// ── Light tokens ─────────────────────────────────────────────────────────────
const light: T = {
  isDark: false,
  pageBg: 'radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.07) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(79,70,229,0.05) 0%, transparent 50%), #F4F6FB',
  pageText: '#111827',
  headerBg: 'rgba(244,246,251,0.95)', headerBorder: 'rgba(0,0,0,0.07)',
  sidebarBg: '#FFFFFF', sidebarBorder: 'rgba(0,0,0,0.08)', sidebarShadow: '2px 0 20px rgba(0,0,0,0.04)',
  logoDivider: 'rgba(0,0,0,0.07)', logoText: '#111827',
  logoIconBg: 'linear-gradient(135deg, #818CF8 0%, #9333EA 50%, #F87171 100%)',
  logoIconShadow: '0 4px 14px rgba(147,51,234,0.40)',
  logoTextGradient: 'linear-gradient(90deg, #A78BFA 0%, #F87171 100%)',
  accentBg: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #F87171 100%)',
  accentShadow: '0 4px 16px rgba(167,139,250,0.45)',
  accentShadowHover: '0 6px 24px rgba(167,139,250,0.65)',
  accentBgActive: 'rgba(167,139,250,0.85)',
  cardBg: '#FFFFFF', cardBorder: 'rgba(0,0,0,0.08)', cardShadow: '0 2px 10px rgba(0,0,0,0.07)',
  cardBorderHover: 'rgba(0,0,0,0.12)', cardShadowHover: '0 12px 40px rgba(0,0,0,0.13), 0 2px 10px rgba(0,0,0,0.06)',
  textPrimary: '#111827', textSecondary: '#6B7280', textMuted: '#9CA3AF', textFaint: '#D1D5DB',
  inputBg: '#FFFFFF', inputBorder: 'rgba(0,0,0,0.10)', inputText: '#111827',
  inputFocusBorder: 'rgba(124,58,237,0.45)', inputFocusShadow: '0 0 0 3px rgba(124,58,237,0.10)', inputBlurBorder: 'rgba(0,0,0,0.10)',
  hoverBg: 'rgba(0,0,0,0.04)',
  navActiveBg: 'rgba(124,58,237,0.09)', navActiveBorder: 'rgba(124,58,237,0.18)', navActiveText: '#5B21B6',
  navActiveIconBg: 'rgba(124,58,237,0.14)', navActiveIcon: '#7C3AED',
  navInactiveText: '#6B7280', navInactiveIconBg: 'rgba(0,0,0,0.05)', navInactiveIcon: '#9CA3AF',
  navSectionLabel: '#9CA3AF',
  boardActiveBg: 'rgba(0,0,0,0.05)', boardActiveBorder: 'rgba(0,0,0,0.09)', boardActiveText: '#111827',
  boardInactiveText: '#6B7280', boardCountBg: 'rgba(0,0,0,0.06)', boardCountText: '#9CA3AF',
  boardInputBg: 'rgba(0,0,0,0.04)', boardInputBorder: 'rgba(0,0,0,0.12)', boardInputText: '#111827',
  tagBg: 'rgba(0,0,0,0.04)', tagBorder: 'rgba(0,0,0,0.08)', tagText: '#6B7280',
  tagHoverBg: 'rgba(124,58,237,0.08)', tagHoverBorder: 'rgba(124,58,237,0.22)', tagHoverText: '#7C3AED',
  statCard1Bg: '#F8F9FC', statCard1Border: 'rgba(0,0,0,0.08)', statCard1Label: '#9CA3AF', statCard1Number: '#111827',
  badgeBg: 'rgba(0,0,0,0.07)', badgeText: '#9CA3AF',
  controlContainerBg: '#FFFFFF', controlContainerBorder: 'rgba(0,0,0,0.09)',
  controlActiveBg: 'rgba(124,58,237,0.10)', controlActiveColor: '#7C3AED', controlInactiveColor: '#9CA3AF',
  selectBtnBg: '#FFFFFF', selectBtnBorder: 'rgba(0,0,0,0.09)', selectBtnText: '#6B7280',
  selectBtnActiveBg: 'rgba(124,58,237,0.10)', selectBtnActiveBorder: 'rgba(124,58,237,0.25)', selectBtnActiveText: '#7C3AED',
  sortActiveBg: 'rgba(124,58,237,0.10)', sortActiveText: '#7C3AED', sortInactiveText: '#9CA3AF',
  accentTagBg: 'rgba(124,58,237,0.09)', accentTagBorder: 'rgba(124,58,237,0.18)', accentTagText: '#6D28D9',
  accentChipBg: 'rgba(124,58,237,0.10)', accentChipText: '#7C3AED', accentChipBorder: 'rgba(124,58,237,0.20)',
  dropdownBg: '#FFFFFF', dropdownBorder: 'rgba(0,0,0,0.10)', dropdownShadow: '0 12px 40px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.06)',
  dropdownText: '#374151', dropdownIcon: '#9CA3AF', dropdownHoverBg: 'rgba(0,0,0,0.05)', dropdownDivider: 'rgba(0,0,0,0.07)',
  aiSummaryBg: 'rgba(124,58,237,0.06)', aiSummaryBorder: 'rgba(124,58,237,0.13)', aiSummaryText: '#6B7280', aiSummaryLabel: 'rgba(124,58,237,0.65)',
  aiTagBg: 'rgba(124,58,237,0.09)', aiTagBorder: 'rgba(124,58,237,0.18)', aiTagText: '#6D28D9',
  modalBg: '#FFFFFF', modalBackdrop: 'rgba(0,0,0,0.25)', modalBorder: 'rgba(0,0,0,0.10)', modalShadow: '0 32px 80px rgba(0,0,0,0.18)',
  modalTitle: '#111827', modalSubtitle: '#9CA3AF',
  modalInputBg: '#F8F9FC', modalInputBorder: 'rgba(0,0,0,0.10)', modalInputText: '#111827',
  modalCloseBg: 'rgba(0,0,0,0.06)', modalCloseText: '#9CA3AF',
  modalPdfBg: '#F8F9FC', modalPdfBorder: 'rgba(0,0,0,0.10)', modalPdfText: '#6B7280',
  floatingBg: 'rgba(255,255,255,0.97)', floatingBorder: 'rgba(0,0,0,0.10)', floatingShadow: '0 8px 40px rgba(0,0,0,0.16)', floatingText: '#374151',
  fabSubLabelBg: 'rgba(255,255,255,0.97)', fabSubLabelBorder: 'rgba(0,0,0,0.10)', fabSubLabelText: '#374151', fabSubLabelShadow: '0 2px 10px rgba(0,0,0,0.10)',
  fabSubBtnBg: '#FFFFFF', fabSubBtnBorder: 'rgba(0,0,0,0.12)', fabSubBtnShadow: '0 4px 16px rgba(0,0,0,0.12)', fabSubBtnIcon: '#6B7280',
  fabSubBtnHoverBg: '#F3F4F6',
  kanbanColBg: 'rgba(0,0,0,0.025)', kanbanColBorder: 'rgba(0,0,0,0.08)', kanbanColDivider: 'rgba(0,0,0,0.07)',
  kanbanCardBg: '#FFFFFF', kanbanCardBorder: 'rgba(0,0,0,0.08)', kanbanCardShadow: '0 1px 4px rgba(0,0,0,0.05)',
  kanbanCardHoverShadow: '0 6px 20px rgba(0,0,0,0.10)', kanbanCardHoverBorder: 'rgba(0,0,0,0.13)',
  kanbanColTitle: '#111827', kanbanColCountBg: 'rgba(0,0,0,0.06)', kanbanColCountText: '#9CA3AF',
  kanbanEmptyText: '#D1D5DB', kanbanCatPillBg: 'rgba(0,0,0,0.06)', kanbanCatPillText: '#6B7280',
  kanbanActionHoverBg: 'rgba(0,0,0,0.07)',
  iconAction: '#D1D5DB', iconMuted: '#9CA3AF',
  emptyIconContainerBg: 'linear-gradient(135deg,rgba(124,58,237,0.10),rgba(79,70,229,0.06))', emptyIconContainerBorder: 'rgba(124,58,237,0.15)',
  emptyIconColor: 'rgba(124,58,237,0.45)', emptyTitle: '#6B7280', emptySub: '#9CA3AF',
  memoBg: '#F5F3FF', memoText: '#374151', memoGloss: 'rgba(124,58,237,0.04)',
  searchDropBg: '#FFFFFF', searchDropBorder: 'rgba(0,0,0,0.10)', searchDropShadow: '0 16px 50px rgba(0,0,0,0.14)',
  searchDropItemText: '#111827', searchDropItemHoverBg: 'rgba(0,0,0,0.04)',
  searchDropIconBg: 'rgba(0,0,0,0.05)', searchDropSecondary: '#9CA3AF',
  searchDropFooterBorder: 'rgba(0,0,0,0.06)', searchDropFooterText: '#9CA3AF',
  mobileOverlay: 'rgba(0,0,0,0.30)',
  bottomNavBg: 'rgba(255,255,255,0.97)', bottomNavBorder: 'rgba(0,0,0,0.08)', bottomNavShadow: '0 -4px 24px rgba(0,0,0,0.08)', bottomNavInactiveText: '#9CA3AF',
};

// ── Dark tokens ──────────────────────────────────────────────────────────────
const dark: T = {
  isDark: true,
  pageBg: 'radial-gradient(ellipse at 20% 0%, rgba(124,58,237,0.12) 0%, transparent 50%), radial-gradient(ellipse at 80% 100%, rgba(79,70,229,0.10) 0%, transparent 50%), #07070F',
  pageText: 'rgba(255,255,255,0.80)',
  headerBg: 'rgba(13,13,24,0.95)', headerBorder: 'rgba(255,255,255,0.05)',
  sidebarBg: 'linear-gradient(180deg,#09090F 0%,#0A0A16 100%)', sidebarBorder: 'rgba(255,255,255,0.05)', sidebarShadow: 'none',
  logoDivider: 'rgba(255,255,255,0.05)', logoText: 'white',
  logoIconBg: 'linear-gradient(135deg, #7C3AED, #4338CA)',
  logoIconShadow: '0 4px 14px rgba(124,58,237,0.35)',
  logoTextGradient: 'linear-gradient(90deg, #7C3AED, #6366F1)',
  accentBg: 'linear-gradient(135deg, #7C3AED, #4F46E5)',
  accentShadow: '0 4px 16px rgba(124,58,237,0.35)',
  accentShadowHover: '0 6px 24px rgba(124,58,237,0.55)',
  accentBgActive: 'rgba(124,58,237,0.85)',
  cardBg: 'linear-gradient(180deg,#111120 0%,#0E0E1C 100%)', cardBorder: 'rgba(255,255,255,0.07)', cardShadow: '0 4px 24px rgba(0,0,0,0.45)',
  cardBorderHover: 'rgba(255,255,255,0.14)', cardShadowHover: '0 16px 60px rgba(0,0,0,0.7), 0 0 20px rgba(124,58,237,0.08)',
  textPrimary: 'rgba(255,255,255,0.85)', textSecondary: 'rgba(255,255,255,0.42)', textMuted: 'rgba(255,255,255,0.28)', textFaint: 'rgba(255,255,255,0.18)',
  inputBg: 'rgba(255,255,255,0.05)', inputBorder: 'rgba(255,255,255,0.08)', inputText: 'rgba(255,255,255,0.80)',
  inputFocusBorder: 'rgba(124,58,237,0.5)', inputFocusShadow: '0 0 0 3px rgba(124,58,237,0.12)', inputBlurBorder: 'rgba(255,255,255,0.08)',
  hoverBg: 'rgba(255,255,255,0.06)',
  navActiveBg: 'linear-gradient(135deg,rgba(124,58,237,0.22),rgba(79,70,229,0.14))', navActiveBorder: 'rgba(124,58,237,0.28)', navActiveText: 'rgba(255,255,255,0.90)',
  navActiveIconBg: 'rgba(124,58,237,0.28)', navActiveIcon: '#A78BFA',
  navInactiveText: 'rgba(255,255,255,0.42)', navInactiveIconBg: 'rgba(255,255,255,0.05)', navInactiveIcon: 'rgba(255,255,255,0.35)',
  navSectionLabel: 'rgba(255,255,255,0.20)',
  boardActiveBg: 'rgba(255,255,255,0.07)', boardActiveBorder: 'rgba(255,255,255,0.10)', boardActiveText: 'rgba(255,255,255,0.88)',
  boardInactiveText: 'rgba(255,255,255,0.42)', boardCountBg: 'rgba(255,255,255,0.06)', boardCountText: 'rgba(255,255,255,0.28)',
  boardInputBg: 'rgba(255,255,255,0.06)', boardInputBorder: 'rgba(255,255,255,0.14)', boardInputText: 'rgba(255,255,255,0.80)',
  tagBg: 'rgba(255,255,255,0.04)', tagBorder: 'rgba(255,255,255,0.07)', tagText: 'rgba(255,255,255,0.32)',
  tagHoverBg: 'rgba(124,58,237,0.12)', tagHoverBorder: 'rgba(124,58,237,0.28)', tagHoverText: '#C4B5FD',
  statCard1Bg: 'rgba(255,255,255,0.03)', statCard1Border: 'rgba(255,255,255,0.06)', statCard1Label: 'rgba(255,255,255,0.28)', statCard1Number: 'white',
  badgeBg: 'rgba(255,255,255,0.07)', badgeText: 'rgba(255,255,255,0.35)',
  controlContainerBg: 'rgba(255,255,255,0.04)', controlContainerBorder: 'rgba(255,255,255,0.07)',
  controlActiveBg: 'rgba(255,255,255,0.10)', controlActiveColor: 'rgba(255,255,255,0.85)', controlInactiveColor: 'rgba(255,255,255,0.28)',
  selectBtnBg: 'rgba(255,255,255,0.05)', selectBtnBorder: 'rgba(255,255,255,0.08)', selectBtnText: 'rgba(255,255,255,0.38)',
  selectBtnActiveBg: 'rgba(124,58,237,0.20)', selectBtnActiveBorder: 'rgba(124,58,237,0.35)', selectBtnActiveText: '#C4B5FD',
  sortActiveBg: 'rgba(255,255,255,0.09)', sortActiveText: 'rgba(255,255,255,0.80)', sortInactiveText: 'rgba(255,255,255,0.28)',
  accentTagBg: 'rgba(124,58,237,0.18)', accentTagBorder: 'rgba(167,139,250,0.22)', accentTagText: '#C4B5FD',
  accentChipBg: 'rgba(124,58,237,0.25)', accentChipText: '#C4B5FD', accentChipBorder: 'rgba(167,139,250,0.25)',
  dropdownBg: '#13132A', dropdownBorder: 'rgba(255,255,255,0.10)', dropdownShadow: '0 20px 60px rgba(0,0,0,0.70)',
  dropdownText: 'rgba(255,255,255,0.65)', dropdownIcon: 'rgba(255,255,255,0.35)', dropdownHoverBg: 'rgba(255,255,255,0.06)', dropdownDivider: 'rgba(255,255,255,0.07)',
  aiSummaryBg: 'rgba(124,58,237,0.08)', aiSummaryBorder: 'rgba(124,58,237,0.15)', aiSummaryText: 'rgba(255,255,255,0.48)', aiSummaryLabel: 'rgba(167,139,250,0.70)',
  aiTagBg: 'rgba(124,58,237,0.18)', aiTagBorder: 'rgba(167,139,250,0.22)', aiTagText: '#C4B5FD',
  modalBg: '#111119', modalBackdrop: 'rgba(0,0,0,0.60)', modalBorder: 'rgba(255,255,255,0.10)', modalShadow: '0 32px 100px rgba(0,0,0,0.75)',
  modalTitle: 'rgba(255,255,255,0.90)', modalSubtitle: 'rgba(255,255,255,0.32)',
  modalInputBg: 'rgba(255,255,255,0.05)', modalInputBorder: 'rgba(255,255,255,0.09)', modalInputText: 'rgba(255,255,255,0.80)',
  modalCloseBg: 'rgba(255,255,255,0.07)', modalCloseText: 'rgba(255,255,255,0.38)',
  modalPdfBg: 'rgba(255,255,255,0.05)', modalPdfBorder: 'rgba(255,255,255,0.09)', modalPdfText: 'rgba(255,255,255,0.45)',
  floatingBg: 'rgba(18,18,30,0.96)', floatingBorder: 'rgba(255,255,255,0.10)', floatingShadow: '0 8px 40px rgba(0,0,0,0.6)', floatingText: 'rgba(255,255,255,0.70)',
  fabSubLabelBg: 'rgba(18,18,30,0.95)', fabSubLabelBorder: 'rgba(255,255,255,0.08)', fabSubLabelText: 'rgba(255,255,255,0.55)', fabSubLabelShadow: 'none',
  fabSubBtnBg: 'rgba(255,255,255,0.09)', fabSubBtnBorder: 'rgba(255,255,255,0.12)', fabSubBtnShadow: '0 4px 20px rgba(0,0,0,0.5)', fabSubBtnIcon: 'rgba(255,255,255,0.65)',
  fabSubBtnHoverBg: 'rgba(255,255,255,0.15)',
  kanbanColBg: 'rgba(255,255,255,0.02)', kanbanColBorder: 'rgba(255,255,255,0.06)', kanbanColDivider: 'rgba(255,255,255,0.05)',
  kanbanCardBg: 'rgba(255,255,255,0.03)', kanbanCardBorder: 'rgba(255,255,255,0.06)', kanbanCardShadow: 'none',
  kanbanCardHoverShadow: 'none', kanbanCardHoverBorder: 'rgba(255,255,255,0.10)',
  kanbanColTitle: 'rgba(255,255,255,0.78)', kanbanColCountBg: 'rgba(255,255,255,0.07)', kanbanColCountText: 'rgba(255,255,255,0.30)',
  kanbanEmptyText: 'rgba(255,255,255,0.18)', kanbanCatPillBg: 'rgba(255,255,255,0.06)', kanbanCatPillText: 'rgba(255,255,255,0.32)',
  kanbanActionHoverBg: 'rgba(255,255,255,0.08)',
  iconAction: 'rgba(255,255,255,0.30)', iconMuted: 'rgba(255,255,255,0.28)',
  emptyIconContainerBg: 'linear-gradient(135deg,rgba(124,58,237,0.15),rgba(79,70,229,0.08))', emptyIconContainerBorder: 'rgba(124,58,237,0.2)',
  emptyIconColor: 'rgba(167,139,250,0.5)', emptyTitle: 'rgba(255,255,255,0.45)', emptySub: 'rgba(255,255,255,0.22)',
  memoBg: '#141420', memoText: 'rgba(255,255,255,0.82)', memoGloss: 'rgba(124,58,237,0.06)',
  searchDropBg: '#12121F', searchDropBorder: 'rgba(255,255,255,0.10)', searchDropShadow: '0 20px 60px rgba(0,0,0,0.70)',
  searchDropItemText: 'rgba(255,255,255,0.78)', searchDropItemHoverBg: 'rgba(255,255,255,0.06)',
  searchDropIconBg: 'rgba(255,255,255,0.07)', searchDropSecondary: 'rgba(255,255,255,0.30)',
  searchDropFooterBorder: 'rgba(255,255,255,0.05)', searchDropFooterText: 'rgba(255,255,255,0.25)',
  mobileOverlay: 'rgba(0,0,0,0.60)',
  bottomNavBg: 'rgba(9,9,18,0.97)', bottomNavBorder: 'rgba(255,255,255,0.06)', bottomNavShadow: '0 -4px 24px rgba(0,0,0,0.40)', bottomNavInactiveText: 'rgba(255,255,255,0.28)',
};

// ── Context ──────────────────────────────────────────────────────────────────
interface ThemeContextValue {
  t: T;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({ t: light, toggleTheme: () => {} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [isDark, setIsDark] = useState<boolean>(() => {
    try { return localStorage.getItem('lb-theme') === 'dark'; } catch { return false; }
  });

  useEffect(() => {
    try { localStorage.setItem('lb-theme', isDark ? 'dark' : 'light'); } catch {}
  }, [isDark]);

  const toggleTheme = () => setIsDark(p => !p);
  const t = isDark ? dark : light;

  return (
    <ThemeContext.Provider value={{ t, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
