// Copy source for authenticated surfaces.
// AA-29 strings for the auth flow pages.

export const AUTH = {
  login: {
    title: "Sign in",
    subtitle: "Access your AppealDeck seller tools.",
    google: "Continue with Google",
    divider: "or sign in with email",
    fields: {
      email: "Email",
      password: "Password",
      forgot: "Forgot?",
    },
    messages: {
      notConfigured: "Auth is not configured.",
      magicSent: "Check your email for a sign-in link.",
      togglePassword: "Use a magic link instead",
      toggleMagic: "Use password instead",
      submitPassword: "Sign in",
      submitMagic: "Email me a sign-in link",
    },
    footer: {
      prompt: "New to AppealDeck?",
      action: "Create an account",
    },
  },
  signup: {
    title: "Create your account",
    subtitle: "Get the decoder free, or buy an Appeal Pass to draft your POA.",
    google: "Continue with Google",
    divider: "or sign up with email",
    fields: {
      email: "Email",
      password: "Password",
      passwordHint: "At least 8 characters.",
    },
    messages: {
      notConfigured: "Auth is not configured.",
      weakPassword: "Password must be at least 8 characters.",
      sent: "Check your email to confirm your account.",
      submit: "Create account",
    },
    footer: {
      prompt: "Already have an account?",
      action: "Sign in",
    },
  },
  forgotPassword: {
    title: "Forgot your password?",
    subtitle: "Enter your account email and we'll send you a reset link.",
    fields: {
      email: "Email",
    },
    messages: {
      notConfigured: "Auth is not configured.",
      sent: "Check your email for a password reset link.",
      submit: "Send reset link",
    },
    footer: {
      prompt: "Remembered it?",
      action: "Sign in",
    },
  },
  resetPassword: {
    title: "Set a new password",
    subtitle: "Choose a strong password you haven't used before.",
    fields: {
      password: "New password",
      confirm: "Confirm new password",
    },
    messages: {
      notConfigured: "Auth is not configured.",
      weakPassword: "Password must be at least 8 characters.",
      mismatch: "Passwords do not match.",
      updated: "Your password has been updated.",
      submit: "Update password",
    },
    success: {
      button: "Go to your case",
    },
  },
} as const;

export const AUTH_SHARED = {
  authNotConfigured: "Auth is not configured.",
} as const;
