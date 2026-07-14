import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import { SharedBoardPage } from "./app/components/SharedBoardPage.tsx";
import { JoinTeamBoard } from "./app/components/JoinTeamBoard.tsx";
import { BlogListPage } from "./app/components/blog/BlogListPage.tsx";
import { BlogPostPage } from "./app/components/blog/BlogPostPage.tsx";
import { LanguageProvider } from "./app/context/LanguageContext.tsx";
import "./styles/index.css";

// LanguageProvider wraps the whole router, not just <App/>: the share/team/blog
// routes call tr() too, and outside a provider it falls back to key => key.
createRoot(document.getElementById("root")!).render(
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
);
