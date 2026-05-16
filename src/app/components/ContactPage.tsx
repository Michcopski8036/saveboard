import { useState } from 'react';
import { X, Mail, Send, CheckCircle } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';
import type { User as SupabaseUser } from '@supabase/supabase-js';

const CONTACT_EMAIL = 'hello@saveboard.app';

const SUBJECTS = [
  'General Inquiry',
  'Feature Request',
  'Bug Report',
  'Support',
  'Billing',
];

interface ContactPageProps {
  onClose: () => void;
  user?: SupabaseUser | null;
}

export function ContactPage({ onClose, user }: ContactPageProps) {
  const { tr } = useLanguage();
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [message, setMessage] = useState('');
  const [name, setName] = useState(user?.user_metadata?.full_name ?? '');
  const [email, setEmail] = useState(user?.email ?? '');
  const [sent, setSent] = useState(false);

  const handleSend = () => {
    if (!message.trim()) return;
    const body = `Name: ${name || 'Not provided'}\nEmail: ${email || 'Not provided'}\n\n${message}`;
    const mailtoUrl = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(`[SaveBoard] ${subject}`)}&body=${encodeURIComponent(body)}`;
    window.open(mailtoUrl, '_blank');
    setSent(true);
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-4 py-10">
          <div className="relative w-full max-w-md rounded-3xl shadow-2xl overflow-hidden bg-white">

            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-6 pb-4" style={{ borderBottom: '1px solid #F3F4F6' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg,rgba(124,58,237,0.12),rgba(99,102,241,0.08))', border: '1px solid rgba(124,58,237,0.18)' }}>
                  <Mail className="w-4 h-4" style={{ color: '#7C3AED' }} />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">{tr('contactUs')}</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">{CONTACT_EMAIL}</p>
                </div>
              </div>
              <button onClick={onClose}
                className="p-2 rounded-xl transition-colors"
                style={{ color: '#9CA3AF' }}
                onMouseEnter={e => { e.currentTarget.style.background = '#F3F4F6'; e.currentTarget.style.color = '#374151'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#9CA3AF'; }}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {sent ? (
              /* Success state */
              <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                  style={{ background: 'rgba(16,185,129,0.10)' }}>
                  <CheckCircle className="w-8 h-8" style={{ color: '#10B981' }} />
                </div>
                <p className="text-[17px] font-bold text-gray-900 mb-1">Email client opened!</p>
                <p className="text-[13px] text-gray-400 max-w-xs">Your message is ready to send in your email app. Press send there to reach us.</p>
                <button onClick={onClose}
                  className="mt-8 px-6 py-2.5 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                  Done
                </button>
              </div>
            ) : (
              /* Form */
              <div className="px-6 py-5 space-y-4">

                {/* Name */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-3.5 py-2.5 rounded-xl text-[14px] focus:outline-none transition-all"
                    style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.10)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="your@email.com"
                    className="w-full px-3.5 py-2.5 rounded-xl text-[14px] focus:outline-none transition-all"
                    style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.10)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Subject */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Subject</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBJECTS.map(s => (
                      <button
                        key={s}
                        onClick={() => setSubject(s)}
                        className="px-3 py-1.5 rounded-lg text-[12px] font-medium transition-all"
                        style={{
                          background: subject === s ? '#7C3AED' : '#F3F4F6',
                          color: subject === s ? 'white' : '#6B7280',
                          border: `1px solid ${subject === s ? '#7C3AED' : 'transparent'}`,
                        }}>
                        {s}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="block text-[11px] font-semibold uppercase tracking-widest text-gray-400 mb-1.5">Message</label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="Write your message here…"
                    rows={5}
                    className="w-full px-3.5 py-2.5 rounded-xl text-[14px] focus:outline-none transition-all resize-none"
                    style={{ background: '#F9FAFB', border: '1px solid #E5E7EB', color: '#374151' }}
                    onFocus={e => { e.currentTarget.style.borderColor = '#7C3AED'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(124,58,237,0.10)'; }}
                    onBlur={e => { e.currentTarget.style.borderColor = '#E5E7EB'; e.currentTarget.style.boxShadow = 'none'; }}
                  />
                </div>

                {/* Send button */}
                <button
                  onClick={handleSend}
                  disabled={!message.trim()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-[14px] font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-40"
                  style={{ background: 'linear-gradient(135deg,#7C3AED,#6366F1)' }}>
                  <Send className="w-4 h-4" />
                  Send Message
                </button>

                <p className="text-center text-[11px] text-gray-400">
                  Opens your email app · We usually reply within 24 hours
                </p>
              </div>
            )}

          </div>
        </div>
      </div>
    </>
  );
}
