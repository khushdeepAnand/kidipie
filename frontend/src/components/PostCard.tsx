import React, { useState } from "react";
import { Heart, MessageCircle, Sparkles, Smile, Send } from "lucide-react";
import type { PostItem, CommentItem } from "../types";
import { usePosts } from "../hooks/usePosts";

interface PostCardProps {
  post: PostItem;
}

const formatRelativeTime = (dateString?: string): string => {
  if (!dateString) return "just now";
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return dateString;

  const now = new Date();
  const diffInSeconds = Math.max(0, Math.floor((now.getTime() - date.getTime()) / 1000));

  if (diffInSeconds < 60) {
    return "just now";
  }

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? "1 min ago" : `${diffInMinutes} mins ago`;
  }

  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return diffInHours === 1 ? "1 hour ago" : `${diffInHours} hours ago`;
  }

  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) {
    return diffInDays === 1 ? "1 day ago" : `${diffInDays} days ago`;
  }

  const diffInWeeks = Math.floor(diffInDays / 7);
  if (diffInWeeks < 4) {
    return diffInWeeks === 1 ? "1 week ago" : `${diffInWeeks} weeks ago`;
  }

  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) {
    return diffInMonths === 1 ? "1 month ago" : `${diffInMonths} months ago`;
  }

  const diffInYears = Math.floor(diffInDays / 365);
  return diffInYears === 1 ? "1 year ago" : `${diffInYears} years ago`;
};

export const PostCard: React.FC<PostCardProps> = ({ post }) => {
  const { toggleLikePost, addReaction, addComment } = usePosts();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");

  const handleCommentSubmit = (e: React.SubmitEvent) => {
    e.preventDefault();
    if (commentText.trim()) {
      addComment(post.id, commentText);
      setCommentText("");
    }
  };
  const fetchUserAvatar = (item: PostItem | CommentItem): string => {
    const user = item.users;
    if (user?.image_url) return user.image_url;
    return `https://api.dicebear.com/9.x/initials/svg?seed=${encodeURIComponent(user?.username ?? "anon")}`;
  };

  return (
    <article className="bg-[var(--bg-card)] rounded-2xl p-5 border-2 border-[var(--border-subtle)] shadow-sm space-y-4 hover:border-[var(--border-medium)] transition-colors">
      {/* Header Info */}
      <div className="flex items-center gap-3">
        <img
          src={fetchUserAvatar(post)}
          alt={post.users?.username ?? "User avatar"}
          className="w-10 h-10 rounded-full border-2 border-[var(--primary)] object-cover shrink-0"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).src =
              "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
          }}
        />
        <div>
          <h3 className="font-bold text-[var(--text-main)] text-sm">
            {post.users?.username || post.author?.username || "User"}
          </h3>
          <span className="text-xs text-[var(--text-muted)] font-medium">
            {formatRelativeTime(post.created_at)}
          </span>
        </div>
        {post.tag && (
          <span className="ml-auto bg-[var(--primary)] text-white text-xs px-3 py-1 rounded-full font-bold shadow-sm">
            {post.tag}
          </span>
        )}
      </div>

      {/* Post Text */}
      {post.content && (
        <p className="text-[var(--text-main)] font-medium text-base leading-relaxed">
          {post.content}
        </p>
      )}

      {/* Post Attachment Image */}
      {post.image_url && (
        <div className="rounded-xl overflow-hidden border border-[var(--border-subtle)] bg-[var(--bg-input)]">
          {post.image_url &&
            <img
              src={post.image_url}
              alt={post.imageAlt ?? "Post attachment"}
              className="w-full max-h-96 object-cover hover:scale-[1.01] transition-transform duration-200"
            />
          }
        </div>
      )}

      {/* Reaction & Action Toolbar */}
      <div className="pt-2 border-t border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Like Button */}
          <button
            onClick={() => toggleLikePost(post.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs transition-all cursor-pointer ${post.userLiked
              ? "bg-red-50 text-[var(--danger)] border border-red-200 scale-105"
              : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
              }`}
          >
            <Heart
              className={`w-4 h-4 ${post.userLiked ? "fill-[var(--danger)] text-[var(--danger)]" : ""}`}
            />
            <span>{post.likesCount}</span>
          </button>

          {/* Sparkles Reaction */}
          <button
            onClick={() => addReaction(post.id, "sparkles")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-amber-50 text-[var(--accent-yellow-text)] font-bold text-xs transition-all cursor-pointer"
            title="Awesome!"
          >
            <Sparkles className="w-3.5 h-3.5 fill-[var(--accent-yellow)] text-[var(--accent-yellow-text)]" />
            <span>{post.reactions.sparkles}</span>
          </button>

          {/* Surprised Reaction */}
          <button
            onClick={() => addReaction(post.id, "surprised")}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-purple-50 text-[var(--primary)] font-bold text-xs transition-all cursor-pointer"
            title="Wow!"
          >
            <Smile className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span>{post.reactions.surprised}</span>
          </button>
        </div>

        {/* Comment Toggle */}
        <button
          onClick={() => setShowComments(!showComments)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--bg-input)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] font-bold text-xs transition-all cursor-pointer"
        >
          <MessageCircle className="w-4 h-4 text-[var(--primary)]" />
          <span>{post.comments?.length} Comments</span>
        </button>
      </div>

      {/* Comments Drawer */}
      {showComments && (
        <div className="pt-3 border-t border-[var(--border-subtle)] space-y-3">
          <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
            {post.comments?.length > 0 ? (
              post.comments.map((c) => (
                <div
                  key={c.comment_id}
                  className="flex items-start gap-2.5 bg-[var(--bg-input)] p-2.5 rounded-xl"
                >
                  <img
                    src={fetchUserAvatar(c)}
                    alt={c.users?.username}
                    className="w-7 h-7 rounded-full object-cover border border-[var(--primary)] shrink-0"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src =
                        "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";
                    }}
                  />
                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-[var(--text-main)]">
                        {c.users?.username}
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)]">
                        {c.created_at}
                      </span>
                    </div>
                    <p className="text-[var(--text-main)] mt-0.5">{c.content}</p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-[var(--text-muted)] italic text-center py-1">
                No comments yet. Be the first to reply!
              </p>
            )}
          </div>

          {/* Comment Form */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Write a nice comment..."
              className="flex-1 bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--primary)] focus:bg-[var(--bg-card)] rounded-full px-3.5 py-1.5 text-xs text-[var(--text-main)] outline-none font-medium placeholder-[var(--text-muted)]"
            />
            <button
              type="submit"
              disabled={!commentText.trim()}
              className="bg-[var(--primary)] text-white px-3 py-1.5 rounded-full text-xs font-bold disabled:opacity-40 cursor-pointer flex items-center gap-1 hover:bg-[var(--primary-hover)] transition-colors"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </article>
  );
};

export default PostCard;
