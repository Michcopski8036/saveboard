import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import { SharedBoardPage } from "./app/components/SharedBoardPage.tsx";
import { JoinTeamBoard } from "./app/components/JoinTeamBoard.tsx";
import { BlogListPage } from "./app/components/blog/BlogListPage.tsx";
import { BlogPostPage } from "./app/components/blog/BlogPostPage.tsx";
import { LanguageProvider } from "./app/context/LanguageContext.tsx";
import { ErrorBoundary } from "./app/components/ErrorBoundary.tsx";
import "./styles/index.css";

// ErrorBoundary is outermost so a render-time throw anywhere shows a recoverable
// card instead of blanking the whole app (the white-screen class of crash).
// LanguageProvider wraps the whole router, not just <App/>: the share/team/blog
// routes call tr() too, and outside a provider it falls back to key => key.
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <BrowserRouter>
      <LanguageProvider>
        <Routes>
          <Route path="/share/:token" element={<SharedBoardPage />} />
          <Route path="/team/:token" element={<JoinTeamBoard />} />
          <Route path="/blog" element={<BlogListPage />} />
          <Route path="/blog/:slug" element={<BlogPostPage />} />
          <Route path="/*" element={<App />} />
        </Routes>
      </LanguageProvider>
    </BrowserRouter>
  </ErrorBoundary>
);
