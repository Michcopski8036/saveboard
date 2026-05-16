import { Bookmark, Link2, FileText, Play, StickyNote, Sparkles, Share2, ArrowRight, Check } from 'lucide-react';

interface Props {
  onGetStarted: () => void;
}

export function LandingPage({ onGetStarted }: Props) {
  return (
    <div className="min-h-screen bg-white font-sans">

      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/90 backdrop-blur-sm border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-5 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-[8px] bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E]">
              <Bookmark className="w-4 h-4 text-white" />
            </div>
            <span className="text-[15px] font-semibold text-gray-900">
              Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
            </span>
          </div>
          <button
            onClick={onGetStarted}
            className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
          >
            Sign in
          </button>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-16 px-5 text-center">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[12px] font-medium text-purple-600 mb-6">
            <Sparkles className="w-3 h-3" />
            AI-powered saving
          </div>
          <h1 className="text-[48px] sm:text-[64px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-5">
            Save everything<br />
            <span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">
              that matters
            </span>
          </h1>
          <p className="text-[18px] text-gray-500 leading-relaxed mb-8 max-w-md mx-auto">
            Collect links, articles, videos and notes — organised in beautiful boards you can share.
          </p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
          >
            Get Started Free
            <ArrowRight className="w-4 h-4" />
          </button>
          <p className="text-[12px] text-gray-400 mt-3">No credit card required</p>
        </div>
      </section>

      {/* App mockup */}
      <section className="px-5 pb-20">
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-[28px] overflow-hidden shadow-2xl shadow-gray-200 border border-gray-100 bg-gray-50">
            {/* Browser chrome */}
            <div className="bg-white border-b border-gray-100 px-4 py-3 flex items-center gap-2">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div className="w-3 h-3 rounded-full bg-gray-200" />
                <div className="w-3 h-3 rounded-full bg-gray-200" />
              </div>
              <div className="flex-1 mx-3 bg-gray-100 rounded-md px-3 py-1 text-[12px] text-gray-400">
                saveboard.app
              </div>
            </div>
            {/* App UI preview */}
            <div className="bg-[#F9FAFB] p-4 min-h-[320px]">
              <div className="flex gap-3">
                {/* Sidebar */}
                <div className="hidden sm:block w-[140px] shrink-0">
                  <div className="flex items-center gap-1.5 mb-4 px-1">
                    <div className="p-1 rounded-[6px] bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E]">
                      <Bookmark className="w-3 h-3 text-white" />
                    </div>
                    <span className="text-[12px] font-bold text-gray-900">SaveBoard</span>
                  </div>
                  {['All Saves','Events','Recipes','Fitness'].map((label, i) => (
                    <div key={label} className={`px-2.5 py-1.5 rounded-lg mb-1 text-[11px] font-medium ${i === 0 ? 'bg-purple-100 text-purple-700' : 'text-gray-500'}`}>
                      {label}
                    </div>
                  ))}
                </div>
                {/* Cards grid */}
                <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {/* YouTube */}
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="h-16 flex items-center justify-center" style={{ background: '#FF0000' }}>
                      <svg viewBox="0 0 90 64" className="w-14 h-auto">
                        <rect width="90" height="64" rx="16" fill="rgba(0,0,0,0.15)"/>
                        <polygon points="35,18 63,32 35,46" fill="white"/>
                      </svg>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-gray-800 leading-tight">The Best Morning Routine</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">youtube.com</p>
                    </div>
                  </div>

                  {/* Instagram */}
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="h-16 flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #feda77 0%, #f58529 25%, #dd2a7b 60%, #8134af 85%, #515bd4 100%)' }}>
                      <svg viewBox="0 0 24 24" className="w-9 h-9" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <rect x="2" y="2" width="20" height="20" rx="5"/>
                        <circle cx="12" cy="12" r="5"/>
                        <circle cx="17.5" cy="6.5" r="1.2" fill="white" stroke="none"/>
                      </svg>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-gray-800 leading-tight">Japan Travel Photos 🇯🇵</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">instagram.com</p>
                    </div>
                  </div>

                  {/* X / Twitter */}
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="h-16 flex items-center justify-center bg-black">
                      <svg viewBox="0 0 24 24" className="w-9 h-9" fill="white">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.746l7.735-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                      </svg>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-gray-800 leading-tight">Thread: How to build in public</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">x.com</p>
                    </div>
                  </div>

                  {/* TikTok */}
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="h-16 flex items-center justify-center" style={{ background: '#010101' }}>
                      <svg viewBox="0 0 24 24" className="w-9 h-9">
                        <path fill="#69C9D0" d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.27 6.27 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V9.35a8.16 8.16 0 0 0 4.79 1.53V7.44a4.85 4.85 0 0 1-1.02-.75z"/>
                        <path fill="#EE1D52" d="M18.57 5.94a4.83 4.83 0 0 1-2.75-4.19V2h-.02a4.83 4.83 0 0 0 2.77 3.94z" opacity="0.8"/>
                      </svg>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-gray-800 leading-tight">Viral pasta carbonara recipe 🍝</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">tiktok.com</p>
                    </div>
                  </div>

                  {/* Medium */}
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="h-16 flex items-center justify-center bg-black">
                      <svg viewBox="0 0 24 24" className="w-9 h-9" fill="white">
                        <path d="M13.54 12a6.8 6.8 0 0 1-6.77 6.82A6.8 6.8 0 0 1 0 12a6.8 6.8 0 0 1 6.77-6.82A6.8 6.8 0 0 1 13.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
                      </svg>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-gray-800 leading-tight">How to learn anything fast</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">medium.com</p>
                    </div>
                  </div>

                  {/* Note */}
                  <div className="bg-white rounded-xl overflow-hidden border border-gray-100 shadow-sm">
                    <div className="h-16 flex items-center justify-center" style={{ background: '#FFFBEB' }}>
                      <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="#D97706" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="8" y1="13" x2="16" y2="13"/>
                        <line x1="8" y1="17" x2="12" y2="17"/>
                      </svg>
                    </div>
                    <div className="p-2">
                      <p className="text-[10px] font-semibold text-gray-800 leading-tight">My workout plan for June</p>
                      <p className="text-[9px] text-gray-400 mt-0.5">Note</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">Save anything, anywhere</h2>
          <p className="text-gray-500 text-center mb-10 text-[16px]">One place for all the content you want to keep.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { icon: Link2,    label: 'Links',    desc: 'Any URL from the web',          bg: '#EDE9FE', color: '#7C3AED' },
              { icon: FileText, label: 'Articles', desc: 'Read-later with auto-preview',  bg: '#FEE2E2', color: '#DC2626' },
              { icon: Play,     label: 'Videos',   desc: 'YouTube, Vimeo & more',         bg: '#DCFCE7', color: '#16A34A' },
              { icon: StickyNote, label: 'Notes',  desc: 'Quick thoughts & memos',        bg: '#FEF9C3', color: '#CA8A04' },
            ].map(({ icon: Icon, label, desc, bg, color }) => (
              <div key={label} className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <p className="font-semibold text-gray-900 text-[14px] mb-1">{label}</p>
                <p className="text-[12px] text-gray-500 leading-snug">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">How it works</h2>
          <p className="text-gray-500 text-center mb-12 text-[16px]">Three simple steps to stay organised.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Save a link', desc: 'Paste any URL. SaveBoard automatically fetches the title, image and description.', color: '#A259FF' },
              { step: '2', title: 'Organise in boards', desc: 'Create boards like Recipes, Travel or Work. Tag and sort everything your way.', color: '#FF7262' },
              { step: '3', title: 'Access anywhere', desc: 'Your saves sync instantly across all your devices. Share boards with anyone.', color: '#F24E1E' },
            ].map(({ step, title, desc, color }) => (
              <div key={step} className="text-center">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold text-[18px] mx-auto mb-4 shadow-lg"
                  style={{ background: color, boxShadow: `0 8px 24px ${color}40` }}>
                  {step}
                </div>
                <h3 className="font-bold text-gray-900 text-[16px] mb-2">{title}</h3>
                <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI feature highlight */}
      <section className="py-16 px-5 bg-gradient-to-br from-[#F5F3FF] to-[#FFF7ED]">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-100 text-[12px] font-medium text-purple-600 mb-4">
              <Sparkles className="w-3 h-3" />
              AI-powered
            </div>
            <h2 className="text-[28px] font-bold text-gray-900 mb-3">Smart tags, automatically</h2>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-5">
              SaveBoard analyses every link you save and suggests relevant tags — so you can find anything fast without ever typing a tag yourself.
            </p>
            {['Auto-generated tags', 'Full-text search', 'Smart filtering'].map(item => (
              <div key={item} className="flex items-center gap-2 mb-2">
                <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
                  <Check className="w-3 h-3 text-purple-600" />
                </div>
                <span className="text-[13px] text-gray-700 font-medium">{item}</span>
              </div>
            ))}
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-5 w-full max-w-[260px]">
              <p className="text-[11px] text-gray-400 mb-2 font-medium">AI suggested tags</p>
              <div className="flex flex-wrap gap-1.5">
                {['productivity','learning','science','technology','design','health','food','travel'].map(tag => (
                  <span key={tag} className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-purple-50 text-purple-600">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Share feature */}
      <section className="py-16 px-5">
        <div className="max-w-3xl mx-auto flex flex-col sm:flex-row-reverse items-center gap-8">
          <div className="flex-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-orange-50 text-[12px] font-medium text-orange-500 mb-4">
              <Share2 className="w-3 h-3" />
              Sharing
            </div>
            <h2 className="text-[28px] font-bold text-gray-900 mb-3">Share boards with anyone</h2>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Made a great collection of recipes or travel spots? Share your board with a link — no account needed to view it.
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-gradient-to-br from-[#A259FF] to-[#F24E1E] rounded-2xl p-px shadow-xl w-full max-w-[260px]">
              <div className="bg-white rounded-[15px] p-5">
                <p className="text-[11px] text-gray-400 mb-1 font-medium">Shared board</p>
                <p className="text-[14px] font-bold text-gray-900 mb-3">My Japan Trip 🇯🇵</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-[11px] text-gray-500 font-mono break-all">
                  saveboard.app/s/abc123
                </div>
                <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white text-[12px] font-semibold">
                  Copy link
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5 text-center bg-gray-50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-[36px] font-extrabold text-gray-900 mb-4 leading-tight">
            Start saving what<br />
            <span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">
              you love today
            </span>
          </h2>
          <p className="text-gray-500 mb-8 text-[16px]">Free to use. No credit card. Takes 10 seconds to get started.</p>
          <button
            onClick={onGetStarted}
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[16px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
          >
            Get Started Free
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-5 border-t border-gray-100">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-[6px] bg-gradient-to-br from-[#1ABCFE] via-[#A259FF] to-[#F24E1E]">
              <Bookmark className="w-3 h-3 text-white" />
            </div>
            <span className="text-[13px] font-semibold text-gray-900">
              Save<span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">Board</span>
            </span>
          </div>
          <p className="text-[12px] text-gray-400">© 2025 SaveBoard. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
