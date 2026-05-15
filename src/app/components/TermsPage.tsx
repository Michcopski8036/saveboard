import { X, FileText } from 'lucide-react';

const LAST_UPDATED = 'May 14, 2026';
const CONTACT_EMAIL = 'creatorsloftperth@gmail.com';

interface Section {
  title: string;
  body: (string | { list: string[] })[];
}

const SECTIONS: Section[] = [
  {
    title: '1. Acceptance of Terms',
    body: [
      'By accessing or using SaveBoard (the "Service"), you agree to be bound by these Terms and Conditions ("Terms"). If you do not agree to these Terms, you may not use the Service.',
      'We reserve the right to update these Terms at any time. Continued use of the Service after changes are posted constitutes your acceptance of the revised Terms.',
    ],
  },
  {
    title: '2. Description of Service',
    body: [
      'SaveBoard is a link-saving and bookmarking application that allows users to save, organise, and retrieve web links, notes, and embedded content. The Service is provided "as is" and is subject to change at any time.',
      'Features available to you depend on your plan (Free or Pro). We reserve the right to modify, add, or remove features at any time with or without notice.',
    ],
  },
  {
    title: '3. User Accounts',
    body: [
      'To use SaveBoard you must create an account. You are responsible for:',
      {
        list: [
          'Providing accurate and complete account information.',
          'Maintaining the confidentiality of your login credentials.',
          'All activity that occurs under your account.',
          'Notifying us immediately of any unauthorised use of your account.',
        ],
      },
      'You must be at least 13 years old to create an account. By creating an account, you represent that you meet this age requirement.',
    ],
  },
  {
    title: '4. Acceptable Use',
    body: [
      'You agree not to use SaveBoard to:',
      {
        list: [
          'Store, share, or link to content that is illegal, harmful, threatening, abusive, defamatory, obscene, or otherwise objectionable.',
          'Infringe any third party\'s intellectual property rights.',
          'Upload malware, viruses, or any destructive code.',
          'Attempt to gain unauthorised access to any part of the Service or other users\' data.',
          'Scrape, crawl, or automate interaction with the Service in a way that places excessive load on our infrastructure.',
          'Use the Service for any commercial purpose without our prior written consent.',
        ],
      },
      'We reserve the right to suspend or terminate accounts that violate these rules without prior notice.',
    ],
  },
  {
    title: '5. Free and Pro Plans',
    body: [
      'SaveBoard offers a Free plan and a paid Pro plan. The current limits are:',
      {
        list: [
          'Free plan: up to 30 links and 5 boards.',
          'Pro plan: unlimited links, unlimited boards, and access to Pro-only features such as Import.',
        ],
      },
      'We reserve the right to change plan limits or pricing at any time. Existing paid subscribers will be notified of price changes at least 30 days in advance.',
      'All payments are processed securely by Stripe. Subscriptions auto-renew unless cancelled. Refunds are handled on a case-by-case basis — contact us at the email below.',
    ],
  },
  {
    title: '6. Your Content',
    body: [
      'You retain full ownership of all content you save to SaveBoard (links, notes, tags, board names, etc.).',
      'By using the Service, you grant us a limited, non-exclusive, royalty-free licence to store, process, and display your content solely for the purpose of providing the Service to you.',
      'We do not claim any ownership over your content and will never use it for advertising or share it with third parties without your consent.',
    ],
  },
  {
    title: '7. Intellectual Property',
    body: [
      'The SaveBoard application, including its design, code, branding, and original content, is owned by us and protected by copyright and other intellectual property laws.',
      'You may not copy, modify, distribute, sell, or lease any part of the Service or its content, or reverse-engineer any part of the software, without our express written permission.',
    ],
  },
  {
    title: '8. Privacy',
    body: [
      'Your use of SaveBoard is also governed by our Privacy Policy, which is incorporated into these Terms by reference. Please review our Privacy Policy to understand our data practices.',
    ],
  },
  {
    title: '9. Disclaimers',
    body: [
      'The Service is provided "as is" and "as available" without warranties of any kind, either express or implied, including but not limited to fitness for a particular purpose, merchantability, or non-infringement.',
      'We do not guarantee that the Service will be uninterrupted, error-free, or free of viruses or other harmful components. We are not responsible for any content on third-party websites that you save to SaveBoard.',
    ],
  },
  {
    title: '10. Limitation of Liability',
    body: [
      'To the maximum extent permitted by applicable law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of data, revenue, or profits, arising out of or related to your use of the Service.',
      'Our total liability for any claim arising from your use of SaveBoard shall not exceed the amount you paid us in the 12 months preceding the claim, or $10 USD, whichever is greater.',
    ],
  },
  {
    title: '11. Termination',
    body: [
      'You may close your account at any time by contacting us. Upon account closure, your data will be permanently deleted within 30 days.',
      'We may suspend or terminate your access to the Service at our discretion if you breach these Terms, without notice or liability to you.',
      'Provisions of these Terms that by their nature should survive termination shall survive, including but not limited to ownership provisions, warranty disclaimers, and limitations of liability.',
    ],
  },
  {
    title: '12. Governing Law',
    body: [
      'These Terms are governed by and construed in accordance with the laws of Western Australia, Australia, without regard to its conflict of law provisions. Any disputes shall be subject to the exclusive jurisdiction of the courts of Western Australia.',
    ],
  },
  {
    title: '13. Contact Us',
    body: [
      `If you have any questions about these Terms, please contact us at ${CONTACT_EMAIL}. We will respond within 5 business days.`,
    ],
  },
];

interface TermsPageProps {
  onClose: () => void;
}

export function TermsPage({ onClose }: TermsPageProps) {
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
                  style={{ background: 'rgba(37,99,235,0.10)', border: '1px solid rgba(37,99,235,0.18)' }}>
                  <FileText className="w-4 h-4" style={{ color: '#2563EB' }} />
                </div>
                <div>
                  <h2 className="text-[18px] font-bold text-gray-900">Terms & Conditions</h2>
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
            <div className="px-6 py-4 mx-6 mt-5 mb-1 rounded-2xl" style={{ background: 'rgba(37,99,235,0.06)', border: '1px solid rgba(37,99,235,0.14)' }}>
              <p className="text-[13px] text-gray-600 leading-relaxed">
                These Terms and Conditions govern your use of SaveBoard. Please read them carefully before using the Service. These Terms constitute a legally binding agreement between you and SaveBoard.
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
                              <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ background: '#2563EB' }} />
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
                <a href={`mailto:${CONTACT_EMAIL}`} className="font-medium" style={{ color: '#2563EB' }}>{CONTACT_EMAIL}</a>
              </p>
            </div>

          </div>
        </div>
      </div>
    </>
  );
}
