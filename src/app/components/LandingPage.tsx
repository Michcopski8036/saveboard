import { Bookmark, Link2, FileText, Play, StickyNote, Sparkles, Share2, ArrowRight, Check, Search, Shield } from 'lucide-react';
import { Link } from 'react-router';

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
          <div className="flex items-center gap-5">
            <Link
              to="/blog"
              className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Blog
            </Link>
            <button
              onClick={onGetStarted}
              className="text-[13px] font-medium text-gray-600 hover:text-gray-900 transition-colors"
            >
              Sign in
            </button>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-28 pb-16 px-5">
        <div className="max-w-5xl mx-auto grid sm:grid-cols-2 gap-12 items-center">

          {/* Left — text */}
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-50 text-[12px] font-medium text-purple-600 mb-6">
              😩 Sound familiar?
            </div>
            <h1 className="text-[44px] sm:text-[54px] font-extrabold text-gray-900 leading-[1.05] tracking-tight mb-6">
              Stop scrolling.<br />
              Find that link{' '}
              <span className="italic bg-gradient-to-r from-[#A259FF] to-[#F24E1E] bg-clip-text text-transparent">
                instantly.
              </span>
            </h1>
            <p className="text-[17px] text-gray-500 leading-relaxed mb-10 max-w-md">
              Tired of digging through group chats to find a schedule link, registration form, or video someone shared weeks ago? SaveBoard keeps all your important links organised in one beautiful place — for parents, coaches, and group leaders.
            </p>
            <div className="flex gap-3 flex-wrap mb-10">
              <button
                onClick={onGetStarted}
                className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
              >
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </button>
              <a
                href="#how"
                className="inline-flex items-center gap-2 px-7 py-3.5 border border-gray-200 bg-white text-gray-600 rounded-2xl font-medium text-[15px] hover:border-[#A259FF] hover:text-[#A259FF] transition-colors"
              >
                See how it works
              </a>
            </div>
            {/* App store download badges */}
            <div className="flex gap-3 flex-wrap -mt-6 mb-10">
              <a href="https://apps.apple.com/app/id6770486850" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-black text-white rounded-xl hover:opacity-90 active:scale-95 transition-all">
                <svg viewBox="0 0 384 512" className="w-6 h-6 fill-white" aria-hidden="true"><path d="M318.7 268.7c-.2-36.7 16.4-64.4 50-84.8-18.8-26.9-47.2-41.7-84.7-44.6-35.5-2.8-74.3 20.7-88.5 20.7-15 0-49.4-19.7-76.4-19.7C71.4 141.6 16 184.6 16 272c0 26.1 4.8 53 14.3 80.7 12.8 36.9 58.9 127.3 107 125.8 25.2-.6 43-17.9 75.8-17.9 31.8 0 48.3 17.9 76.4 17.9 48.6-.7 90.3-83 102.5-120-65.2-30.7-61.7-90-61.3-89.8zM254.4 70.7c19.1-22.9 17.4-43.8 16.8-51.3-16.9.9-36.5 11.5-47.6 24.5-12.3 14-19.5 31.4-17.9 50.7 18.3 1.4 35-8 48.7-23.9z"/></svg>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-80">Download on the</span>
                  <span className="block text-[16px] font-semibold -mt-0.5">App Store</span>
                </span>
              </a>
              <a href="https://play.google.com/store/apps/details?id=app.saveboard.saveboard" target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 bg-black text-white rounded-xl hover:opacity-90 active:scale-95 transition-all">
                <svg viewBox="0 0 512 512" className="w-6 h-6" aria-hidden="true">
                  <path fill="#00D9FF" d="M48 59.5C45.5 62.9 44 67.9 44 74.3v363.4c0 6.4 1.5 11.4 4 14.8l1.2 1.2 203.5-203.5v-4.8L49.2 58.3 48 59.5z"/>
                  <path fill="#FFD500" d="M320.5 322.5l-67.8-67.8v-4.8l67.9-67.9 1.5.9 80.4 45.7c23 13 23 34.3 0 47.4l-80.4 45.7-1.6.8z"/>
                  <path fill="#FF3333" d="M322 321.6l-69.3-69.3L48 457c7.6 8 20.1 9 34.2 1L322 321.6z"/>
                  <path fill="#00F076" d="M322 182.9L82.2 47C68.1 39 55.6 40 48 48l204.7 204.4L322 182.9z"/>
                </svg>
                <span className="text-left leading-tight">
                  <span className="block text-[10px] opacity-80">GET IT ON</span>
                  <span className="block text-[16px] font-semibold -mt-0.5">Google Play</span>
                </span>
              </a>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex">
                {['🧑‍🦰','👩','🧑','👩‍🦱'].map((e, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-[14px] -ml-2 first:ml-0"
                    style={{ background: ['#FDE68A','#BBF7D0','#BFDBFE','#FCA5A5'][i] }}>
                    {e}
                  </div>
                ))}
              </div>
              <span className="text-[13px] text-gray-500">Join parents, coaches & group leaders getting organised</span>
            </div>
          </div>

          {/* Right — WhatsApp chat mockup */}
          <div>
            <div className="bg-white rounded-3xl shadow-2xl shadow-gray-200 overflow-hidden border border-gray-100 max-w-[360px] mx-auto">
              {/* Chat header */}
              <div className="bg-[#075E54] px-5 py-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-[#25D366] flex items-center justify-center text-[18px]">🏀</div>
                <div>
                  <p className="text-white text-[15px] font-medium">Basketball Team 🏀</p>
                  <p className="text-white/70 text-[12px]">12 members</p>
                </div>
              </div>
              {/* Chat body */}
              <div className="bg-[#ECE5DD] px-4 py-4 flex flex-col gap-2.5">
                {/* Incoming message 1 */}
                <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] text-[13px] text-gray-800">
                  Here's the registration link for the tournament 👇
                  <div className="mt-1.5 bg-gray-100 border-l-[3px] border-[#25D366] rounded px-2 py-1.5 text-[11px] text-[#128C7E] break-all">
                    sports.com/tournament/registration/2026/season-b-u12...
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">Mon 9:14 AM</p>
                </div>
                {/* Incoming message 2 */}
                <div className="bg-white rounded-xl rounded-tl-sm px-3 py-2 max-w-[85%] text-[13px] text-gray-800">
                  And the schedule PDF 📅
                  <div className="mt-1.5 bg-gray-100 border-l-[3px] border-[#25D366] rounded px-2 py-1.5 text-[11px] text-[#128C7E] break-all">
                    drive.google.com/file/d/1BxiMVs8pp3nZ3yPQh...
                  </div>
                  <p className="text-[10px] text-gray-400 mt-1 text-right">Mon 9:15 AM</p>
                </div>
                {/* Outgoing message */}
                <div className="bg-[#DCF8C6] rounded-xl rounded-tr-sm px-3 py-2 max-w-[85%] self-end text-[13px] text-gray-800">
                  Thanks! 🙏
                  <p className="text-[10px] text-gray-400 mt-1 text-right">9:20 AM</p>
                </div>
                {/* 3 weeks later callout */}
                <div className="bg-amber-50 border-l-[3px] border-amber-400 rounded-xl px-3 py-2 max-w-[90%] text-[12px] text-amber-800">
                  😩 <em>3 weeks later...</em><br />"Where was that registration link again??"
                  <p className="text-[10px] text-amber-500 mt-1 text-right">3 weeks later</p>
                </div>
              </div>
            </div>

            {/* Transform arrow + SaveBoard card */}
            <div className="flex items-center gap-4 mt-5 max-w-[360px] mx-auto">
              <div className="flex flex-col items-center gap-1 shrink-0">
                <div className="w-11 h-11 rounded-full bg-[#A259FF] flex items-center justify-center text-white text-[20px]">→</div>
                <span className="text-[11px] text-gray-400">SaveBoard</span>
              </div>
              <div className="flex-1 bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-md">
                <div className="h-[68px] bg-gradient-to-br from-[#A259FF] to-[#F24E1E] flex items-center justify-center text-[26px]">🏀</div>
                <div className="p-3">
                  <span className="text-[10px] font-medium text-[#7C3AED] bg-purple-50 px-2 py-0.5 rounded-full">Basketball</span>
                  <p className="text-[13px] font-semibold text-gray-900 mt-1.5">Tournament Registration 2026</p>
                  <p className="text-[11px] text-gray-400 mt-0.5">sports.com/tournament/registration...</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Problem */}
      <section className="py-16 px-5 bg-gradient-to-br from-[#F5F3FF] to-[#FFF7ED]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">
            Important links get{' '}
            <span className="italic bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">lost</span>{' '}
            in the scroll
          </h2>
          <p className="text-gray-500 text-center mb-10 text-[16px]">Every busy parent, coach, and group leader knows this pain.</p>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { emoji: '📱', title: 'Buried in group chats', desc: 'Schedule links, registration forms, and videos get buried under hundreds of messages. Finding them again takes forever.' },
              { emoji: '🗂️', title: 'Different types, scattered', desc: 'Some links are PDFs, some are websites, some are videos — scattered across WhatsApp, email, and texts.' },
              { emoji: '🔄', title: '"Can you send that link again?"', desc: "Nobody wants to ask — or answer — that question for the fifth time. It's embarrassing and annoying for everyone." },
            ].map(({ emoji, title, desc }) => (
              <div key={title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm">
                <div className="text-[28px] mb-3">{emoji}</div>
                <p className="font-semibold text-gray-900 text-[15px] mb-1.5">{title}</p>
                <p className="text-[13px] text-gray-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solution */}
      <section className="py-16 px-5 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">
            One place for{' '}
            <span className="italic bg-gradient-to-r from-[#A259FF] to-[#F24E1E] bg-clip-text text-transparent">all</span>{' '}
            your links
          </h2>
          <p className="text-gray-500 text-center mb-10 text-[16px]">Everything you need to stay organised, all in one place.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { icon: Link2,      label: 'Beautiful visual cards',   desc: 'Every link becomes a rich preview with image, title, and description.',          bg: '#EDE9FE', color: '#7C3AED' },
              { icon: FileText,   label: 'Organise by activity',     desc: 'Create boards for Basketball, Gymnastics, Tennis — each activity tidy and separate.',  bg: '#CCFBF1', color: '#0D9488' },
              { icon: Search,     label: 'Find in seconds',          desc: 'Search by title, notes, or tags. No more scrolling through hundreds of messages.',  bg: '#FEF9C3', color: '#CA8A04' },
              { icon: StickyNote, label: 'Add notes & reminders',    desc: 'Add context like "Register by June 1st" so you never forget the details.',        bg: '#FFE4E6', color: '#E11D48' },
              { icon: Play,       label: 'Save in seconds',          desc: 'Just paste a link and SaveBoard does the rest. Title, image, description — auto-fetched.', bg: '#DBEAFE', color: '#2563EB' },
              { icon: Shield,     label: 'Private & just yours',     desc: 'Your links are private. No one sees your board unless you choose to share.',      bg: '#DCFCE7', color: '#16A34A' },
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
      <section id="how" className="py-20 px-5">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-[32px] font-bold text-center text-gray-900 mb-2">How it works</h2>
          <p className="text-gray-500 text-center mb-12 text-[16px]">Three steps. Two minutes. Zero lost links.</p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Save a link', desc: 'Paste any URL or share from your phone. SaveBoard automatically fetches the title, image and description.', color: '#A259FF' },
              { step: '2', title: 'Curate your boards', desc: 'Create boards for each activity — Basketball, Gymnastics, Tennis. Keep every link exactly where you need it.', color: '#FF7262' },
              { step: '3', title: 'Find it instantly', desc: 'Search in seconds. No more "Can you send that link again?" — it\'s always right there when you need it.', color: '#F24E1E' },
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
            <h2 className="text-[28px] font-bold text-gray-900 mb-3">Find anything instantly</h2>
            <p className="text-[15px] text-gray-500 leading-relaxed mb-5">
              SaveBoard automatically tags every link you save — so whether it's a registration form, schedule PDF, or a tournament video, you can find it in seconds without scrolling anywhere.
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
            <h2 className="text-[28px] font-bold text-gray-900 mb-3">Share with the whole team</h2>
            <p className="text-[15px] text-gray-500 leading-relaxed">
              Share your Basketball or Gymnastics board with other parents — just send a link. No account needed to view it.
            </p>
          </div>
          <div className="flex-1 flex items-center justify-center">
            <div className="bg-gradient-to-br from-[#A259FF] to-[#F24E1E] rounded-2xl p-px shadow-xl w-full max-w-[260px]">
              <div className="bg-white rounded-[15px] p-5">
                <p className="text-[11px] text-gray-400 mb-1 font-medium">Shared board</p>
                <p className="text-[14px] font-bold text-gray-900 mb-3">My Korea Trip 🇰🇷</p>
                <div className="bg-gray-50 rounded-lg px-3 py-2 text-[11px] text-gray-500 font-mono break-all">
                  saveboard.app/share/abc123
                </div>
                <button className="mt-3 w-full py-2 rounded-xl bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white text-[12px] font-semibold">
                  Copy link
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Founder story */}
      <section className="py-16 px-5 bg-amber-50 border-y border-amber-100">
        <div className="max-w-2xl mx-auto text-center">
          <p className="text-[20px] sm:text-[24px] text-gray-900 leading-relaxed mb-6"
            style={{ fontFamily: "'Fraunces', serif", fontStyle: 'italic', fontWeight: 300 }}>
            "Three kids, so many group chats, hundreds of messages — and I was spending more time scrolling than actually parenting. Every time I needed a schedule link, I had to scroll forever. I built SaveBoard so nobody has to do that anymore."
          </p>
          <div className="flex items-center justify-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#A259FF] to-[#F24E1E] flex items-center justify-center text-xl">👩</div>
            <div className="text-left">
              <p className="font-semibold text-gray-900 text-[15px]">Mihee</p>
              <p className="text-[13px] text-gray-500">Founder of SaveBoard · Mum of 3</p>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 px-5 text-center bg-gray-50">
        <div className="max-w-xl mx-auto">
          <h2 className="text-[36px] font-extrabold text-gray-900 mb-4 leading-tight">
            Never lose a link<br />
            <span className="bg-gradient-to-r from-[#A259FF] via-[#FF7262] to-[#F24E1E] bg-clip-text text-transparent">
              again
            </span>
          </h2>
          <p className="text-gray-500 mb-8 text-[16px]">SaveBoard is free to start. No scrolling required ever again.</p>
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
          <p className="text-[12px] text-gray-400">© 2026 SaveBoard. All rights reserved.</p>
        </div>
      </footer>

    </div>
  );
}
