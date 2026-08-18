import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { Analytics } from "@vercel/analytics/react";
import App from "./app/App.tsx";
import { SharedBoardPage } from "./app/components/SharedBoardPage.tsx";
import { JoinTeamBoard } from "./app/components/JoinTeamBoard.tsx";
import { BlogListPage } from "./app/components/blog/BlogListPage.tsx";
import { BlogPostPage } from "./app/components/blog/BlogPostPage.tsx";
import { ResetPassword } from './app/components/ResetPassword';
import { GuideListPage } from "./app/components/guides/GuideListPage.tsx";
import { GuidePostPage } from "./app/components/guides/GuidePostPage.tsx";
import { LanguageProvider } from "./app/context/LanguageContext.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import { usePageviews } from "./app/lib/track.ts";
import "./styles/index.css";

// ErrorBoundary is outermost so a render-time throw anywhere shows a recoverable
// card instead of blanking the whole app (the white-screen class of crash).
// LanguageProvider wraps the whole router, not just <App/>: the share/team/blog
// routes call tr() too, and outside a provider it falls back to key => key.
// usePageviews needs router context, so the routes live in a component inside
// <BrowserRouter> rather than inline.
function TrackedRoutes() {
  usePageviews();
  return (
    <Routes>
      <Route path="/share/:token" element={<SharedBoardPage />} />
      <Route path="/team/:token" element={<JoinTeamBoard />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      {/* Without these two, /guides/* falls through to <App/> and a human
          visitor gets the dashboard while crawlers see the prerendered HTML. */}
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/guides" element={<GuideListPage />} />
      <Route path="/guides/:slug" element={<GuidePostPage />} />
      <Route path="/*" element={<App />} />
    </Routes>
  );
}

createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <LanguageProvider>
        <TrackedRoutes />
        <Analytics />
      </LanguageProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
