"use client";

import { useState } from "react";
import { Eye, EyeOff, Loader2, Lock, Mail, TerminalSquare, User as UserIcon } from "lucide-react";

import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthModalStore } from "@/store/auth-modal-store";
import { useUserStore } from "@/store/user-store";

interface FormState {
  name: string;
  username: string;
  email: string;
  password: string;
}

type FormErrors = Partial<Record<keyof FormState, string>>;

const EMPTY_FORM: FormState = { name: "", username: "", email: "", password: "" };

function validateEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function validateUsername(value: string) {
  return /^[a-zA-Z0-9_-]{3,20}$/.test(value);
}

/**
 * Real form, mocked backend: there's no user database behind this yet
 * (see user-store.ts), so Sign In always resolves to the same demo
 * account regardless of credentials — but Sign Up feeds what you actually
 * type into that session, so the account you "create" reflects your
 * input instead of a hardcoded name. Client-side validation is real;
 * there's just nothing on the other end to check the password against.
 */
export function AuthModal() {
  const isOpen = useAuthModalStore((s) => s.isOpen);
  const mode = useAuthModalStore((s) => s.mode);
  const close = useAuthModalStore((s) => s.close);
  const setMode = useAuthModalStore((s) => s.setMode);

  const signIn = useUserStore((s) => s.signIn);
  const isLoading = useUserStore((s) => s.isLoading);

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [showPassword, setShowPassword] = useState(false);

  const isSignUp = mode === "sign-up";

  function updateField(field: keyof FormState, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  function validate(): FormErrors {
    const next: FormErrors = {};
    if (isSignUp && form.name.trim().length < 2) {
      next.name = "Enter your full name.";
    }
    if (isSignUp && !validateUsername(form.username)) {
      next.username = "3-20 characters: letters, numbers, - or _.";
    }
    if (!validateEmail(form.email)) {
      next.email = "Enter a valid email address.";
    }
    if (form.password.length < 8) {
      next.password = "At least 8 characters.";
    }
    return next;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    await signIn({
      email: form.email.trim(),
      ...(isSignUp
        ? { name: form.name.trim(), username: form.username.trim() }
        : {}),
    });
    setForm(EMPTY_FORM);
    setErrors({});
    close();
  }

  // Radix only ever calls this with `false` here — the modal has no
  // DialogTrigger of its own, it's opened exclusively via
  // useAuthModalStore.open() from wherever "Sign In" appears in the app.
  function handleOpenChange(open: boolean) {
    if (open) return;
    setForm(EMPTY_FORM);
    setErrors({});
    setShowPassword(false);
    close();
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogTitle className="sr-only">
          {isSignUp ? "Create your Tadius account" : "Sign in to Tadius"}
        </DialogTitle>
        <DialogDescription className="sr-only">
          {isSignUp
            ? "Create an account to save progress and launch real environments."
            : "Sign in to save progress and launch real environments."}
        </DialogDescription>

        <div className="flex flex-col items-center gap-2 border-b border-white/[0.06] px-6 pb-5 pt-7 text-center">
          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-tadius-green-500/10 ring-1 ring-tadius-green-500/30">
            <TerminalSquare className="h-5 w-5 text-tadius-green-500" strokeWidth={2} />
          </div>
          <h2 className="font-heading text-lg font-semibold text-white">
            {isSignUp ? "Create your account" : "Welcome back"}
          </h2>
          <p className="font-body text-xs text-tadius-gray-muted">
            {isSignUp
              ? "Save your progress and launch real Linux environments."
              : "Sign in to pick up where you left off."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5" noValidate>
          {isSignUp && (
            <div className="space-y-1.5">
              <label htmlFor="auth-name" className="font-body text-xs font-medium text-tadius-gray-soft">
                Full name
              </label>
              <div className="relative">
                <UserIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tadius-gray-muted" />
                <Input
                  id="auth-name"
                  autoComplete="name"
                  className="pl-9"
                  error={!!errors.name}
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              {errors.name && <p className="font-body text-xs text-red-400">{errors.name}</p>}
            </div>
          )}

          {isSignUp && (
            <div className="space-y-1.5">
              <label
                htmlFor="auth-username"
                className="font-body text-xs font-medium text-tadius-gray-soft"
              >
                Username
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-mono text-sm text-tadius-gray-muted">
                  @
                </span>
                <Input
                  id="auth-username"
                  autoComplete="username"
                  className="pl-8 font-mono"
                  error={!!errors.username}
                  value={form.username}
                  onChange={(e) => updateField("username", e.target.value)}
                  placeholder="jane-doe"
                />
              </div>
              {errors.username && (
                <p className="font-body text-xs text-red-400">{errors.username}</p>
              )}
            </div>
          )}

          <div className="space-y-1.5">
            <label htmlFor="auth-email" className="font-body text-xs font-medium text-tadius-gray-soft">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tadius-gray-muted" />
              <Input
                id="auth-email"
                type="email"
                autoComplete="email"
                className="pl-9"
                error={!!errors.email}
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="you@example.com"
              />
            </div>
            {errors.email && <p className="font-body text-xs text-red-400">{errors.email}</p>}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="auth-password"
              className="font-body text-xs font-medium text-tadius-gray-soft"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-tadius-gray-muted" />
              <Input
                id="auth-password"
                type={showPassword ? "text" : "password"}
                autoComplete={isSignUp ? "new-password" : "current-password"}
                className="pl-9 pr-9"
                error={!!errors.password}
                value={form.password}
                onChange={(e) => updateField("password", e.target.value)}
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-tadius-gray-muted transition-colors hover:text-white"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" strokeWidth={2} />
                ) : (
                  <Eye className="h-4 w-4" strokeWidth={2} />
                )}
              </button>
            </div>
            {errors.password && <p className="font-body text-xs text-red-400">{errors.password}</p>}
          </div>

          <Button type="submit" className="w-full gap-2" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" strokeWidth={2} />
                {isSignUp ? "Creating account..." : "Signing in..."}
              </>
            ) : (
              <>{isSignUp ? "Create Account" : "Sign In"}</>
            )}
          </Button>

          <p className="text-center font-body text-xs text-tadius-gray-muted">
            {isSignUp ? "Already have an account?" : "Don't have an account?"}{" "}
            <button
              type="button"
              onClick={() => {
                setErrors({});
                setMode(isSignUp ? "sign-in" : "sign-up");
              }}
              className="font-medium text-tadius-green-500 hover:underline"
            >
              {isSignUp ? "Sign in" : "Create one"}
            </button>
          </p>
        </form>
      </DialogContent>
    </Dialog>
  );
}
