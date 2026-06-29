import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import App from "./app/App.tsx";
import { SharedBoardPage } from "./app/components/SharedBoardPage.tsx";
import { JoinTeamBoard } from "./app/components/JoinTeamBoard.tsx";
import { BlogListPage } from "./app/components/blog/BlogListPage.tsx";
import { BlogPostPage } from "./app/components/blog/BlogPostPage.tsx";
import "./styles/index.css";

createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <Routes>
      <Route path="/share/:token" element={<SharedBoardPage />} />
      <Route path="/team/:token" element={<JoinTeamBoard />} />
      <Route path="/blog" element={<BlogListPage />} />
      <Route path="/blog/:slug" element={<BlogPostPage />} />
      <Route path="/*" element={<App />} />
    </Routes>
  </BrowserRouter>
);
