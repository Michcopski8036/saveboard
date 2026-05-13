import { useState } from 'react';
import { X, Search, ChevronDown, ChevronRight, Link2, Tag, Layout, Star, Download, Trash2, Columns2, Mail } from 'lucide-react';

interface FAQ {
  q: string;
  a: string;
}

interface Guide {
  title: string;
  steps: string[];
}

interface Section {
  icon: React.ElementType;
  color: string;
  bg: string;
  title: string;
  faqs: FAQ[];
  guide?: Guide;
}

const SECTIONS: Section[] = [
  {
    icon: Link2,
    color: '#7C3AED',
    bg: 'rgba(124,58,237,0.10)',
    title: 'Adding Links',
    guide: {
      title: 'How to add your first link',
      steps: [
        'Paste a URL into the bar at the top of the screen.',
        'Press Enter or tap the Save button.',
        'LinkBoard fetches the title, description, and preview image automatically.',
        'You can also type a plain note (no URL needed) — it saves as a memo card.',
        'To upload a PDF or image file, tap the paperclip icon next to the input bar.',
      ],
    },
    faqs: [
      { q: 'Can I save YouTube videos or tweets?', a: 'Yes — paste any URL and LinkBoard will fetch a preview. Embed codes (YouTube <iframe>, Twitter widget) are also supported.' },
      { q: 'What happens if the link has no preview image?', a: 'LinkBoard shows a styled placeholder. You can always edit the title and description manually.' },
      { q: 'Can I add a note without a link?', a: 'Yes. Just type any text in the input bar (no https://) and it saves as a memo card.' },
    ],
  },
  {
    icon: Layout,
    color: '#2563EB',
    bg: 'rgba(37,99,235,0.10)',
    title: 'Boards & Collections',
    guide: {
      title: 'Organising links into boards',
      steps: [
        'In the sidebar, click the + button next to BOARDS to create a new board.',
        'Give it a name like "Design Inspiration" or "Reading List".',
        'Open any link card and use the board picker to move it to a board.',
        'To rename or delete a board, hover over it in the sidebar and click ···',
        'Use the Kanban view to see all your boards as columns side by side.',
      ],
    },
    faqs: [
      { q: 'What is the difference between Collections and Boards?', a: 'Collections (Home, Recently Saved, Favorites, Unsorted) are automatic smart filters. Boards are custom categories you create yourself.' },
      { q: 'How many boards can I create?', a: 'Free plan: up to 5 boards. Pro plan: unlimited boards.' },
      { q: 'Can I share a board?', a: 'Yes — hover over a board in the sidebar, click ··· and choose Share to get a public read-only link.' },
    ],
  },
  {
    icon: Tag,
    color: '#059669',
    bg: 'rgba(5,150,105,0.10)',
    title: 'Tags',
    guide: {
      title: 'Using tags to find things fast',
      steps: [
        'LinkBoard auto-generates tags from your links (e.g. #video, #github, #design).',
        'Tags appear in the sidebar — click one to filter all matching links instantly.',
        'To add your own tag: open a link card, tap Edit, and type in the Tags field.',
        'Press Enter after each tag to add it. Backspace removes the last tag.',
        'As you type, existing tags appear as suggestions — tap one to apply it.',
      ],
    },
    faqs: [
      { q: 'Where do the auto-tags come from?', a: 'LinkBoard analyses the link\'s URL, title, and description to suggest relevant tags like #video, #ai, #tutorial, #social, and more.' },
      { q: 'Can I remove an auto-generated tag?', a: 'Auto-tags are derived on the fly and cannot be deleted, but you can filter them out by selecting a different collection.' },
      { q: 'Are tags case-sensitive?', a: 'No — "AI", "ai", and "Ai" all map to the same #ai tag.' },
    ],
  },
  {
    icon: Star,
    color: '#D97706',
    bg: 'rgba(217,119,6,0.10)',
    title: 'Favorites & Search',
    faqs: [
      { q: 'How do I favorite a link?', a: 'Tap the star icon on any link card. Favorited links appear in the Favorites collection in the sidebar.' },
      { q: 'How do I search?', a: 'Click the search icon in the header (or tap Search in the bottom nav on mobile). Type any keyword — results update instantly across titles, descriptions, and URLs.' },
      { q: 'Can I search inside a specific board?', a: 'Select the board first, then use the search bar — results are scoped to the current view.' },
      { q: 'What is the Unsorted collection?', a: 'It shows all links that have not been assigned to a board yet, so you can quickly tidy them up.' },
    ],
  },
  {
    icon: Columns2,
    color: '#DB2777',
    bg: 'rgba(219,39,119,0.10)',
    title: 'Views & Layout',
    faqs: [
      { q: 'What view modes are available?', a: 'Masonry (Pinterest-style), Grid (fixed tiles), List (compact rows), and Kanban (board columns). Switch using the icons in the top-right of the header.' },
      { q: 'How do I sort my links?', a: 'Use the sort dropdown (top-right of the content area) to switch between Newest, Oldest, A–Z, and Z–A.' },
      { q: 'How do I delete multiple links at once?', a: 'Click Select in the header, tap each link you want to remove, then press Delete. A confirmation bar appears at the bottom.' },
      { q: 'Can I change the app theme?', a: 'Yes — click your avatar → Theme, then choose Light, Dark, or System.' },
    ],
  },
  {
    icon: Download,
    color: '#0EA5E9',
    bg: 'rgba(14,165,233,0.10)',
    title: 'Export & Import',
    faqs: [
      { q: 'How do I export my links?', a: 'Go to Settings → Export links. A JSON file containing all your links and boards is downloaded to your device.' },
      { q: 'How do I import links?', a: 'Settings → Import links, then select a previously exported LinkBoard JSON file. Note: Import replaces your current data.' },
      { q: 'Is import available on the free plan?', a: 'Import is a Pro feature. Export is available on all plans.' },
    ],
  },
  {
    icon: Trash2,
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.10)',
    title: 'Account & Data',
    faqs: [
      { q: 'How do I change my language?', a: 'Click your avatar → Language, then select from the list. The entire interface updates instantly.' },
      { q: 'Is my data safe?', a: 'All data is stored securely in Supabase (PostgreSQL). Your links are private to your account.' },
      { q: 'How do I sign out?', a: 'Click your avatar at the top right, then tap Log out at the bottom of the menu.' },
      { q: 'What is the free plan limit?', a: 'Free plan includes up to 30 links and 5 boards. Upgrade to Pro for unlimited links, boards, and import.' },
    ],
  },
];

interface HelpPageProps {
  onClose: () => void;
  onShowContact: () => void;
}

export function HelpPage({ onClose, onShowContact }: HelpPageProps) {
  const [search, setSearch] = useState('');
  const [openSection, setOpenSection] = useState<string | null>('Adding Links');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const q = search.toLowerCase();

  const filtered = SECTIONS.map(section => {
    if (!q) return section;
    const faqs = section.faqs.filter(f => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q));
    const guideMatch = section.guide && (
      section.guide.title.toLowerCase().includes(q) ||
      section.guide.steps.some(s => s.toLowerCase().includes(q))
    );
    if (!faqs.length && !guideMatch && !section.title.toLowerCase().includes(q)) return null;
    return { ...section, faqs: guideMatch ? section.faqs : faqs };
  }).filter(Boolean) as Section[];

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-4 py-10">
          <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden bg-white">

            {/* Header */}
            <div className="px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">Help & FAQ</h2>
                  <p className="text-[12px] text-gray-400 mt-0.5">Guides and answers for LinkBoard</p>
                </div>
                <button onClick={onClose}
                  className="p-2 rounded-xl transition-colors"
                  style={{ color: '#9CA3AF' }}
                  onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}>
                  <X className="w-5 h-5" />
                </button>
              </div>
              {/* Search */}
              <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: '#F9FAFB', border: '1px solid #E5E7EB' }}>
                <Search className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                <input
                  type="text"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search guides and FAQs…"
                  className="flex-1 bg-transparent text-[14px] outline-none text-gray-700 placeholder-gray-400"
                  autoFocus
                />
                {search && (
                  <button onClick={() => setSearch('')} className="shrink-0" style={{ color: '#9CA3AF' }}>
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content */}
            <div className="overflow-y-auto max-h-[60vh]">
              {filtered.length === 0 ? (
                <div className="text-center py-16">
                  <p className="text-[15px] font-semibold text-gray-700">No results for "{search}"</p>
                  <p className="text-[13px] text-gray-400 mt-1">Try different keywords or contact us below</p>
                </div>
              ) : (
                filtered.map(section => {
                  const { icon: Icon, color, bg, title, guide, faqs } = section;
                  const isOpen = openSection === title || !!search;
                  return (
                    <div key={title} style={{ borderBottom: '1px solid #F3F4F6' }}>
                      {/* Section header */}
                      <button
                        onClick={() => setOpenSection(isOpen && !search ? null : title)}
                        className="w-full flex items-center gap-3 px-5 py-4 text-left transition-colors"
                        onMouseEnter={e => { if (!isOpen) e.currentTarget.style.background = '#FAFAFA'; }}
                        onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: bg }}>
                          <Icon className="w-4 h-4" style={{ color }} />
                        </div>
                        <span className="flex-1 text-[14px] font-semibold text-gray-800">{title}</span>
                        {!search && (
                          isOpen
                            ? <ChevronDown className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                            : <ChevronRight className="w-4 h-4 shrink-0" style={{ color: '#9CA3AF' }} />
                        )}
                      </button>

                      {/* Section body */}
                      {isOpen && (
                        <div className="pb-3">
                          {/* How-to guide */}
                          {guide && (
                            <div className="mx-5 mb-3 p-4 rounded-2xl" style={{ background: bg, border: `1px solid ${color}22` }}>
                              <p className="text-[11px] font-bold uppercase tracking-widest mb-2.5" style={{ color }}>How-to guide</p>
                              <p className="text-[13px] font-semibold text-gray-800 mb-2">{guide.title}</p>
                              <ol className="space-y-1.5">
                                {guide.steps.map((step, i) => (
                                  <li key={i} className="flex gap-2.5 text-[12px] text-gray-600">
                                    <span className="w-4 h-4 rounded-full flex items-center justify-center shrink-0 text-[9px] font-bold text-white mt-0.5"
                                      style={{ background: color, minWidth: '1rem' }}>
                                      {i + 1}
                                    </span>
                                    {step}
                                  </li>
                                ))}
                              </ol>
                            </div>
                          )}

                          {/* FAQs */}
                          {faqs.map(faq => {
                            const faqKey = `${title}::${faq.q}`;
                            const faqOpen = openFaq === faqKey || !!search;
                            return (
                              <div key={faq.q} className="mx-3">
                                <button
                                  onClick={() => setOpenFaq(faqOpen && !search ? null : faqKey)}
                                  className="w-full flex items-start gap-2.5 px-3 py-2.5 rounded-xl text-left transition-colors"
                                  onMouseEnter={e => { e.currentTarget.style.background = '#F9FAFB'; }}
                                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}>
                                  <span className="text-[13px] font-medium text-gray-700 flex-1 leading-snug">{faq.q}</span>
                                  {!search && (
                                    faqOpen
                                      ? <ChevronDown className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
                                      : <ChevronRight className="w-3.5 h-3.5 shrink-0 mt-0.5" style={{ color: '#9CA3AF' }} />
                                  )}
                                </button>
                                {faqOpen && (
                                  <p className="px-3 pb-2.5 text-[12px] leading-relaxed text-gray-500">{faq.a}</p>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer CTA */}
            <div className="px-6 py-4 flex items-center justify-between" style={{ borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
              <div>
                <p className="text-[13px] font-semibold text-gray-700">Still need help?</p>
                <p className="text-[11px] text-gray-400">We usually reply within 24 hours</p>
              </div>
              <button
                onClick={() => { onClose(); onShowContact(); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white transition-opacity hover:opacity-90"
                style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                <Mail className="w-3.5 h-3.5" />
                Contact us
              </button>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
