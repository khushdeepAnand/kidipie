import React, { useEffect, useState } from "react";
import PostBox from "../components/PostBox";
import PostCard from "../components/PostCard";
import { fetchPosts } from "../api/axios";
import type { CreatedPost, PostItem } from "../types";
import { useAuth } from "../context/AuthContext";

export const toFeedPost = (post: CreatedPost): PostItem => ({
  id: String(post.post_id),
  author: {
    username: post.users?.username || "User",
    image_url: post.users?.image_url || "",
    id: post.users?.user_id || "",
    email: post.users?.email || "",
  },

  users: {
    username: post.users?.username || "User",
    image_url: post.users?.image_url || "",
  },
  content: post.content,
  image_url: post.image_url ?? undefined,
  created_at: post.created_at,
  likesCount: 0,
  reactions: {
    heart: post.reactions?.heart ?? 0,
    surprised: post.reactions?.surprised ?? 0,
    sparkles: post.reactions?.sparkles ?? 0,
  },
  comments: [],
});

export const HomePage: React.FC = () => {
  const { user } = useAuth()
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getPosts = async () => {
      try {
        const response = await fetchPosts();
        setPosts((response as CreatedPost[]).map(toFeedPost));
      } catch (error) {
        console.error("Failed to fetch posts", error);
      } finally {
        setLoading(false);
      }
    };
    getPosts();
  }, []);

  useEffect(() => {
    const handlePostCreated = (event: Event) => {
      const created = (event as CustomEvent<CreatedPost>).detail;
      if (created) setPosts((prev) => [toFeedPost(created), ...prev]);
    };
    window.addEventListener("post-created", handlePostCreated);
    return () => window.removeEventListener("post-created", handlePostCreated);
  }, []);

  const handleCreatedPost = (created: CreatedPost) => {
    setPosts((prev) => [toFeedPost(created), ...prev]);
  };

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <div className="space-y-6">
      <PostBox
        currentUser={user}
        onPost={handleCreatedPost}
        placeholder="Share your latest project or idea..."
      />

      {posts?.length > 0 ? (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      ) : (
        <div className="bg-[var(--bg-card)] border-2 border-dashed border-[var(--border-medium)] rounded-2xl p-8 text-center">
          <p className="text-[var(--text-muted)] font-medium">
            No posts yet. Share something above to get started!
          </p>
        </div>
      )}
    </div>
  );
};

export default HomePage;
