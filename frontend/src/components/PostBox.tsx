import React, { useEffect, useState, useRef, type ChangeEvent } from "react";
import { Image as ImageIcon, X, Loader2, Send } from "lucide-react";
import type { PostBoxProps } from "../types";
import { createPost } from "../api/axios";

const TAG_OPTIONS = ["Project", "Drawing", "Craft", "Science"];
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

export const PostBox: React.FC<PostBoxProps> = ({
  currentUser,
  onPost,
  placeholder = "Share what you made today...",
  className = "",
}) => {

  const [content, setContent] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>("Project");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!selectedFile) {
      setPreviewUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(selectedFile);
    setPreviewUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [selectedFile]);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Please choose an image file.");
      return;
    }
    if (file.size > MAX_IMAGE_BYTES) {
      setError("Please choose an image smaller than 10MB.");
      return;
    }
    setError(null);
    setSelectedFile(file);
  };

  const onFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  const removeImage = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const resetForm = () => {
    setContent("");
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async (e?: React.SubmitEvent) => {
    if (e) e.preventDefault();
    const trimmedContent = content.trim();
    if (!trimmedContent && !selectedFile) return;

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createPost({
        content: trimmedContent,
        image: selectedFile || null,
      });
      await onPost?.(created);
      resetForm();
    } catch (err) {
      console.error("Failed to publish post:", err);
      setError("Could not publish your post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = content.trim().length > 0 || !!selectedFile;

  return (
    <div
      className={`bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 border-2 border-[var(--border-subtle)] shadow-sm ${className}`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={onFileInputChange}
        accept="image/*"
        className="hidden"
      />

      <div className="flex gap-3 sm:gap-4 items-start">
        {currentUser?.image_url && (
          <div className="w-10 h-10 rounded-full border-2 border-[var(--primary)] overflow-hidden bg-[var(--bg-input)] shrink-0">
            <img
              src={currentUser.image_url}
              alt={currentUser?.username || "User"}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="flex-1">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={placeholder}
            rows={2}
            className="w-full bg-[var(--bg-input)] border border-[var(--border-medium)] focus:border-[var(--primary)] focus:bg-[var(--bg-card)] rounded-xl p-3 text-sm sm:text-base font-medium text-[var(--text-main)] placeholder-[var(--text-muted)] outline-none resize-none transition-colors"
          />

          {previewUrl && (
            <div className="mt-3 relative inline-block">
              <img
                src={previewUrl}
                alt="Attachment preview"
                className="w-32 h-32 object-cover rounded-xl border border-[var(--border-subtle)]"
              />
              <button
                type="button"
                onClick={removeImage}
                className="absolute -top-2 -right-2 bg-[var(--danger)] text-white p-1 rounded-full shadow-md hover:opacity-90 transition-opacity cursor-pointer"
                title="Remove photo"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {error && (
            <p className="mt-2 text-xs font-medium text-[var(--danger)]">{error}</p>
          )}

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--border-subtle)] gap-2 flex-wrap">
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-[var(--accent-yellow)] text-[var(--accent-yellow-text)] font-bold text-xs px-3 py-2 rounded-xl flex items-center gap-1.5 hover:brightness-95 transition-all cursor-pointer shadow-xs"
              >
                <ImageIcon className="w-4 h-4" />
                <span>Photo</span>
              </button>

              <div className="flex items-center gap-1">
                {TAG_OPTIONS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`text-xs px-2.5 py-1 rounded-full font-bold transition-colors cursor-pointer ${selectedTag === tag
                      ? "bg-[var(--primary)] text-white"
                      : "bg-[var(--bg-input)] text-[var(--text-secondary)] hover:bg-[var(--bg-subtle)]"
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() => handleSubmit()}
              disabled={!isFormValid || isSubmitting}
              className={`bg-[var(--primary)] text-white font-bold text-sm px-5 py-2 rounded-xl flex items-center gap-2 transition-all ${isFormValid && !isSubmitting
                ? "hover:bg-[var(--primary-hover)] cursor-pointer shadow-sm"
                : "opacity-50 cursor-not-allowed"
                }`}
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              <span>Post</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostBox;
