import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { User, Lock, Eye, EyeOff } from "lucide-react";
import GoogleIcon from "../components/GoogleIcon";
import { loginUser } from "../api/axios";
import { useAuth } from "../context/AuthContext";

export type Tokens = {
  access_token: string;
  refresh_token: string;
  user_id: string;
}

export function LoginPage() {
  const { setToken } = useAuth()
  const navigate = useNavigate()
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.SubmitEvent) => {
    e.preventDefault();
    const res = await loginUser({
      email: identifier.trim(),
      password: password.trim()
    })
    console.log(res)
    setToken(res)
console.log("before navigate");

  navigate('/');

  console.log("after navigate");
  };

  return (
    <div className="min-h-screen bg-[var(--bg-app)] flex flex-col justify-center items-center px-4 py-8 sm:py-12 selection:bg-[var(--primary)]/20 selection:text-[var(--primary)] font-sans">
      {/* Main Card */}
      <div className="w-full max-w-[440px] bg-[var(--bg-card)] rounded-[32px] shadow-[0_20px_60px_rgba(93,57,223,0.07)] overflow-hidden relative border border-[var(--border-subtle)]">
        {/* Top Accent Gradient Bar */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[var(--primary)] via-purple-500 via-[var(--accent-yellow)] to-emerald-500" />

        <div className="px-6 py-8 sm:px-10 sm:py-10">
          {/* Logo & Header */}
          <div className="text-center mb-7">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--primary)] tracking-tight mb-4">
              KidiPie
            </h1>
            <h2 className="text-xl sm:text-2xl font-bold text-[var(--text-main)] mb-1.5">
              Sign in to KidiPie
            </h2>
            <p className="text-sm font-medium text-[var(--text-muted)]">
              Welcome back to the fun zone!
            </p>
          </div>

          {/* Google Sign In Button */}
          <button
            type="button"
            id="google-signin-btn"
            className="w-full py-3 px-4 bg-[var(--bg-card)] hover:bg-[var(--bg-app)] active:scale-[0.99] border border-[var(--border-medium)] rounded-full flex items-center justify-center gap-3 text-sm font-bold text-[var(--text-main)] transition-all duration-150 shadow-sm cursor-pointer"
          >
            <GoogleIcon className="w-5 h-5 shrink-0" />
            <span>Sign in with Google</span>
          </button>

          {/* Divider */}
          <div className="relative flex py-5 items-center">
            <div className="grow border-t border-[var(--border-subtle)]" />
            <span className="shrink mx-4 text-xs font-semibold text-[var(--text-muted)] lowercase">
              or
            </span>
            <div className="grow border-t border-[var(--border-subtle)]" />
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Identifier Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                <User className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <input
                id="login-identifier"
                type="email"
                required
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="Email or Username"
                className="w-full pl-12 pr-4 py-3.5 bg-transparent border border-[var(--border-medium)] rounded-full text-sm font-medium text-[var(--text-main)] placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/15 transition duration-150"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[var(--text-muted)]">
                <Lock className="w-5 h-5" strokeWidth={1.8} />
              </div>
              <input
                id="login-password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                className="w-full pl-12 pr-12 py-3.5 bg-transparent border border-[var(--border-medium)] rounded-full text-sm font-medium text-[var(--text-main)] placeholder:[var(--text-muted)] focus:outline-none focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary)]/15 transition duration-150"
              />
              <button
                type="button"
                id="toggle-password-visibility"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-[var(--text-muted)] hover:text-[var(--text-main)] transition-colors cursor-pointer"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" strokeWidth={1.8} />
                ) : (
                  <Eye className="w-4 h-4" strokeWidth={1.8} />
                )}
              </button>
            </div>

            {/* Submit Button */}
            <div className="pt-2">
              <button
                id="login-submit-btn"
                type="submit"
                className="w-full py-3.5 px-6 bg-[var(--primary)] hover:bg-[var(--primary-hover)] active:scale-[0.99] text-white font-bold rounded-full shadow-[0_4px_16px_rgba(93,57,223,0.35)] transition-all duration-150 text-sm tracking-wide cursor-pointer"
              >
                Sign in
              </button>
            </div>
          </form>

          {/* Links */}
          <div className="mt-5 text-center space-y-3">
            <div>
              <button
                type="button"
                id="forgot-password-link"
                className="text-sm font-semibold text-[var(--primary)] hover:underline transition-colors cursor-pointer"
              >
                Forgot password?
              </button>
            </div>
            <p className="text-sm font-medium text-[var(--text-main)]">
              Don&apos;t have an account?{" "}
              <Link
                to="/signup"
                id="switch-to-signup-link"
                className="font-bold text-[var(--primary)] hover:underline cursor-pointer ml-0.5"
              >
                Sign up
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs font-semibold text-[var(--text-muted)] tracking-normal">
        © 2026 KidiPie - Play Safe, Create More!
      </footer>
    </div>
  );
}

export default LoginPage;
