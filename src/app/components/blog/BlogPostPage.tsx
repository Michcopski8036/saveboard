import { useEffect } from 'react';
import { Link, useParams, Navigate } from 'react-router';
import { ArrowLeft, ArrowRight, Calendar } from 'lucide-react';
import { getPostBySlug, formatDate } from '../../utils/blogUtils';
import { renderMarkdown } from '../../utils/markdownRenderer';
import { Nav, BlogFooter } from './BlogListPage';
import { useLanguage } from '../../context/LanguageContext';

const BASE_URL = 'https://www.saveboard.app';

export function BlogPostPage() {
  const { language } = useLanguage();
  const ko = language === 'ko';
  const { slug } = useParams<{ slug: string }>();
  const post = getPostBySlug(slug ?? '');

  useEffect(() => {
    if (!post) return;
    document.title = `${post.title} — SaveBoard Blog`;
    setMeta('description', post.description);
    setMeta('og:title', `${post.title} — SaveBoard Blog`);
    setMeta('og:description', post.description);
    setCanonical(`${BASE_URL}/blog/${post.slug}`);
    return () => {
      document.title = 'SaveBoard — Stop scrolling. Find that link instantly.';
      setMeta('description', 'Tired of losing links in group chats? SaveBoard organises all your important links in one beautiful place.');
      setCanonical(BASE_URL);
    };
  }, [post]);

  if (!post) return <Navigate to="/blog" replace />;

  return (
    <div className="min-h-screen bg-white font-sans">
      <Nav />

      <main className="pt-24 pb-20 px-5">
        <div className="max-w-2xl mx-auto">

          <Link
            to="/blog"
            className="inline-flex items-center gap-1.5 text-[13px] font-medium text-gray-500 hover:text-gray-900 transition-colors mb-10"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            {ko ? '전체 글' : 'All articles'}
          </Link>

          <header className="mb-10">
            <div className="flex items-center gap-2 text-[13px] text-gray-400 mb-4">
              <Calendar className="w-3.5 h-3.5" />
              {formatDate(post.date)}
            </div>
            <h1 className="text-[36px] sm:text-[44px] font-extrabold text-gray-900 leading-[1.1] tracking-tight mb-5">
              {post.title}
            </h1>
            <p className="text-[18px] text-gray-500 leading-relaxed border-l-4 border-purple-200 pl-4">
              {post.description}
            </p>
          </header>

          <div className="h-px bg-gray-100 mb-10" />

          <article className="prose-style">
            {renderMarkdown(post.content)}
          </article>

          <div className="mt-16 rounded-2xl bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 p-8 text-center">
            <p className="text-[13px] font-semibold text-purple-600 mb-2">{ko ? '써볼 준비 됐나요?' : 'Ready to try it?'}</p>
            <h2 className="text-[24px] font-extrabold text-gray-900 mb-3">
              {ko ? '오늘부터 링크를 저장해보세요' : 'Start saving links from WhatsApp today'}
            </h2>
            <p className="text-[15px] text-gray-500 mb-6 max-w-sm mx-auto">
              {ko ? '무료로 시작 · 모든 기기에서 작동 · 1분이면 설정 끝.' : 'Free to start. Works on any device. Takes under a minute to set up.'}
            </p>
            <Link
              to="/?auth=1"
              className="inline-flex items-center gap-2 px-7 py-3.5 bg-gradient-to-r from-[#A259FF] to-[#FF7262] text-white rounded-2xl font-semibold text-[15px] hover:opacity-90 active:scale-95 transition-all shadow-lg shadow-purple-200"
            >
              {ko ? '무료로 시작하기' : 'Get Started Free'}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>

      <BlogFooter />
    </div>
  );
}

function setMeta(name: string, content: string) {
  const isProp = name.startsWith('og:');
  const attr = isProp ? 'property' : 'name';
  let el = document.querySelector(`meta[${attr}="${name}"]`);
  if (!el) { el = document.createElement('meta'); el.setAttribute(attr, name); document.head.appendChild(el); }
  el.setAttribute('content', content);
}

function setCanonical(href: string) {
  let el = document.querySelector('link[rel="canonical"]');
  if (!el) { el = document.createElement('link'); el.setAttribute('rel', 'canonical'); document.head.appendChild(el); }
  el.setAttribute('href', href);
}
