import { X, Shield } from 'lucide-react';

const LAST_UPDATED = 'May 14, 2026';
const CONTACT_EMAIL = 'creatorsloftperth@gmail.com';

interface Section {
  title: string;
  body: (string | { list: string[] })[];
}

const SECTIONS: Section[] = [
  {
    title: '1. Information We Collect',
    body: [
      'When you create an account and use LinkBoard, we collect the following information:',
      {
        list: [
          'Account information: your email address and profile data provided via your sign-in provider (e.g. Google OAuth).',
          'Content you save: links, notes, embed codes, titles, descriptions, tags, board names, and any other content you add to LinkBoard.',
          'Usage data: how you interact with the app (views, sorts, feature usage) to help us improve the product.',
          'Device information: browser type, operating system, and IP address for security and analytics purposes.',
        ],
      },
      'We do not collect payment card details directly. Any Pro plan billing is handled by our payment processor (Stripe) under their own privacy policy.',
    ],
  },
  {
    title: '2. How We Use Your Information',
    body: [
      'We use the information we collect to:',
      {
        list: [
          'Provide, operate, and maintain the LinkBoard service.',
          'Sync your saved links and boards across devices.',
          'Fetch metadata (title, description, preview image) for URLs you save — this request is made from our server to the target website.',
          'Send transactional emails (e.g. password reset, account notifications).',
          'Analyse aggregate usage trends to improve features and performance.',
          'Respond to your support requests.',
        ],
      },
      'We do not sell, rent, or share your personal information with third parties for marketing purposes.',
    ],
  },
  {
    title: '3. Data Storage & Security',
    body: [
      'Your data is stored in Supabase (PostgreSQL), a secure cloud database platform hosted on AWS infrastructure. Data is encrypted in transit (TLS) and at rest.',
      'File uploads (PDFs, images) are stored in Supabase Storage with access controls scoped to your account. No other user can access your files.',
      'While we implement industry-standard security measures, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security.',
    ],
  },
  {
    title: '4. Third-Party Services',
    body: [
      'LinkBoard uses the following third-party services, each subject to their own privacy policies:',
      {
        list: [
          'Supabase — database, authentication, and file storage.',
          'Vercel — hosting and edge delivery.',
          'Google OAuth — optional sign-in provider (only if you choose "Continue with Google").',
          'Stripe — payment processing for Pro subscriptions.',
        ],
      },
    ],
  },
  {
    title: '5. Cookies & Local Storage',
    body: [
      'LinkBoard uses browser localStorage to remember your preferences (theme, language, session token). We do not use third-party advertising cookies.',
      'Your authentication session token is stored securely and expires automatically after a period of inactivity.',
    ],
  },
  {
    title: '6. Your Rights',
    body: [
      'You have the right to:',
      {
        list: [
          'Access your data: export all your links and boards at any time via Settings → Export links.',
          'Delete your data: contact us and we will permanently delete your account and all associated data within 30 days.',
          'Correct your data: update your profile information at any time within the app.',
          'Withdraw consent: you may close your account at any time.',
        ],
      },
      'If you are located in the European Economic Area (EEA), you have additional rights under GDPR, including the right to data portability and the right to lodge a complaint with a supervisory authority.',
    ],
  },
  {
    title: '7. Data Retention',
    body: [
      'We retain your data for as long as your account is active. If you delete your account, we will remove your personal data from our systems within 30 days, except where retention is required by law.',
    ],
  },
  {
    title: '8. Children\'s Privacy',
    body: [
      'LinkBoard is not directed to children under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us and we will delete it promptly.',
    ],
  },
  {
    title: '9. Changes to This Policy',
    body: [
      'We may update this Privacy Policy from time to time. When we do, we will update the "Last updated" date at the top of this page. For significant changes, we will notify you via email or an in-app notice.',
      'Continued use of LinkBoard after changes are posted constitutes your acceptance of the updated policy.',
    ],
  },
  {
    title: '10. Contact Us',
    body: [
      `If you have any questions about this Privacy Policy or how we handle your data, please contact us at ${CONTACT_EMAIL}.`,
    ],
  },
];

interface PrivacyPageProps {
  onClose: () => void;
}

export function PrivacyPage({ onClose }: PrivacyPageProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" style={{ zIndex: 9990 }} onClick={onClose} />
      <div className="fixed inset-0 overflow-y-auto" style={{ zIndex: 9991 }}>
        <div className="min-h-full flex items-center justify-center p-4 py-10">
          <div className="relative w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden bg-white">

            {/* Header */}
            <div className="sticky top-0 bg-white flex items-center justify-between px-6 pt-6 pb-4 z-10"
              style={{ borderBottom: '1px solid #F3F4F6' }}>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: 'rgba(5,150,105,0.10)', border: '1px solid rgba(5,150,105,0.18)' }}>
                  <Shield className="w-4 h-4" style={{ color: '#059669' }} />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">Privacy Policy</h2>
                  <p className="text-[11px] text-gray-400 mt-0.5">Last updated {LAST_UPDATED}</p>
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

            {/* Intro */}
            <div className="px-6 py-4 mx-6 mt-5 mb-1 rounded-2xl" style={{ background: 'rgba(5,150,105,0.06)', border: '1px solid rgba(5,150,105,0.14)' }}>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                LinkBoard ("we", "us", "our") is committed to protecting your privacy. This policy explains what data we collect, how we use it, and the choices you have. By using LinkBoard, you agree to the practices described here.
              </p>
            </div>

            {/* Sections */}
            <div className="px-6 pb-8 space-y-6 mt-4 max-h-[60vh] overflow-y-auto">
              {SECTIONS.map(section => (
                <div key={section.title}>
                  <h3 className="text-[13px] font-bold text-gray-800 mb-2">{section.title}</h3>
                  <div className="space-y-2">
                    {section.body.map((block, i) =>
                      typeof block === 'string' ? (
                        <p key={i} className="text-[12px] text-gray-500 leading-relaxed">{block}</p>
                      ) : (
                        <ul key={i} className="space-y-1.5 ml-1">
                          {block.list.map((item, j) => (
                            <li key={j} className="flex gap-2 text-[12px] text-gray-500 leading-relaxed">
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#059669' }} />
                              {item}
                            </li>
                          ))}
                        </ul>
                      )
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 text-center" style={{ borderTop: '1px solid #F3F4F6', background: '#FAFAFA' }}>
              <p className="text-[11px] text-gray-400">
                Questions? Email us at{' '}
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium" style={{ color: '#059669' }}>{CONTACT_EMAIL}</a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
