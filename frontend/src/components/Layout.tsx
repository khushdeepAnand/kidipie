import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import PostBox from './PostBox';
import { X, Sparkles } from 'lucide-react';
import { usePosts } from '../hooks/usePosts';
import { useAuth } from '../context/AuthContext';
import type { CreatedPost } from '../types';

export const Layout: React.FC = () => {
  const [isNewPostModalOpen, setIsNewPostModalOpen] = useState(false);
  const { userProfile } = usePosts();
  const { user } = useAuth();

  const handlePostSubmit = (created: CreatedPost) => {
    window.dispatchEvent(new CustomEvent('post-created', { detail: created }));
    setIsNewPostModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] text-[var(--text-main)] flex flex-col font-sans selection:bg-[var(--accent-yellow)] selection:text-[var(--accent-yellow-text)]">
      {/* Top Header */}
      <Header />

      {/* Body Content Shell */}
      <div className="flex-1 flex max-w-7xl w-full mx-auto relative pb-20 lg:pb-6">
        {/* Desktop Sidebar */}
        <Sidebar onOpenNewPost={() => setIsNewPostModalOpen(true)} />

        {/* Dynamic Route Outlet */}
        <main className="flex-1 lg:ml-64 p-4 md:p-6 max-w-3xl w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Navigation Bar */}
      <MobileBottomNav onOpenNewPost={() => setIsNewPostModalOpen(true)} />

      {/* New Post Modal Popup */}
      {isNewPostModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-[var(--bg-card)] rounded-3xl w-full max-w-lg overflow-hidden border-2 border-[var(--border-subtle)] shadow-2xl animate-in zoom-in-95">
            <div className="bg-[var(--bg-app)] px-5 py-4 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[var(--primary)]" />
                <h3 className="font-extrabold text-[var(--text-main)] text-lg">Create New Post</h3>
              </div>
              <button
                onClick={() => setIsNewPostModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[var(--bg-subtle)] hover:bg-[var(--border-subtle)] text-[var(--text-muted)] flex items-center justify-center transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4">
              <PostBox
                currentUser={user ?? userProfile}
                onPost={handlePostSubmit}
                placeholder="What amazing thing did you build or draw today?"
                className="border-none shadow-none p-0"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;
