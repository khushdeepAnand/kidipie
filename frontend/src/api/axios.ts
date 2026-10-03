import axios from "axios";
import type { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from "axios";
import { type SignUpFormData } from "../Auth/SignUpPage";
import type { CreatedPost } from "../types";

const BASE_URL = "http://localhost:8000/api/v1/";

export type Tokens = {
  access_token: string;
  refresh_token: string;
  user_id: string;
};

type RefreshResponse = {
  access_token: string;
  refresh_token?: string;
  user_id?: string;
  expires_in?: number;
  token_type?: string;
};

type RetryConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

const AUTH_SKIP_REFRESH = ["/auth/login", "/auth/signup", "/auth/refresh"];

export const getStoredTokens = (): Tokens | null => {
  const stored = localStorage.getItem("tokens");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as Tokens;
  } catch {
    return null;
  }
};

export const setStoredTokens = (tokens: Tokens) => {
  localStorage.setItem("tokens", JSON.stringify(tokens));
  window.dispatchEvent(new Event("auth-tokens-changed"));
};

export const clearStoredTokens = () => {
  localStorage.removeItem("tokens");
  window.dispatchEvent(new Event("auth-tokens-changed"));
};

const shouldSkipRefresh = (url?: string) =>
  Boolean(url && AUTH_SKIP_REFRESH.some((path) => url.includes(path)));

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Dedicated instance for token refresh to avoid interceptor loops
const refreshClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const tokens = getStoredTokens();
  if (tokens?.access_token && !shouldSkipRefresh(config.url)) {
    config.headers.Authorization = `Bearer ${tokens.access_token}`;
  }
  if (typeof FormData !== "undefined" && config.data instanceof FormData) {
    if (config.headers.delete) {
      config.headers.delete("Content-Type");
    } else {
      delete config.headers["Content-Type"];
    }
  }
  return config;
});

let isRefreshing = false;
let pendingQueue: Array<{
  resolve: (accessToken: string) => void;
  reject: (error: unknown) => void;
}> = [];

const flushQueue = (error: unknown, accessToken: string | null) => {
  pendingQueue.forEach((pending) => {
    if (error || !accessToken) {
      pending.reject(error);
    } else {
      pending.resolve(accessToken);
    }
  });
  pendingQueue = [];
};

const rotateTokens = async (): Promise<string> => {
  const stored = getStoredTokens();
  if (!stored?.refresh_token) {
    throw new Error("No refresh token available");
  }

  const { data } = await refreshClient.post<RefreshResponse>(
    "auth/refresh",
    { refresh_token: stored.refresh_token }
  );

  const nextTokens: Tokens = {
    access_token: data.access_token,
    refresh_token: data.refresh_token || stored.refresh_token,
    user_id: data.user_id || stored.user_id,
  };

  setStoredTokens(nextTokens);
  return data.access_token;
};

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetryConfig | undefined;

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipRefresh(originalRequest.url)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise<string>((resolve, reject) => {
        pendingQueue.push({ resolve, reject });
      }).then((accessToken) => {
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const accessToken = await rotateTokens();
      flushQueue(null, accessToken);
      originalRequest.headers.Authorization = `Bearer ${accessToken}`;
      return api(originalRequest);
    } catch (refreshError) {
      flushQueue(refreshError, null);
      clearStoredTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export interface UserCredentials {
  email: string;
  password: string;
}

export interface PostData {
  content: string;
  image?: File | null;
}

export interface CommentData {
  post_id: string;
  content: string;
}

export const loginUser = async (credentials: UserCredentials) => {
  try {
    const response = await api.post<Tokens>("auth/login", credentials);
    setStoredTokens(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const signUpUser = async (credentials: SignUpFormData) => {
  try {
    const response = await api.post<Tokens>("auth/signup", credentials);
    setStoredTokens(response.data);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const createPost = async ({ content, image }: PostData): Promise<CreatedPost> => {
  const formData = new FormData();
  formData.append("content", content);
  if (image) {
    formData.append("image", image);
  }
  const response = await api.post<CreatedPost>("posts/create", formData);
  return response.data;
};

export const createComment = async (_commentData: CommentData) => {
  return;
};

export const fetchPosts = async () => {
  try {
    const response = await api.get("posts/list");
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const fetchComments = async (post_id: number) => {
  try {
    const response = await api.get(`comments/${post_id}`);
    return response.data;
  } catch (error) {
    throw error;
  }
};

export const logoutUser = () => {
  clearStoredTokens();
};
