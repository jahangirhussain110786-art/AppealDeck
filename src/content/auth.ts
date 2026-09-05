// Copy source for auth pages (login / signup / forgot / reset).
// Strings moved verbatim per AA-29. Auth pages restyle in Wave C (out of scope here).

export const AUTH = {
  login: {
    heading: "Sign in",
    subline: "Access your AppealDeck seller tools.",
    passwordMode: {
      submit: "Sign in",
    },
    magicMode: {
      submit: "Email me a sign-in link",
    },
    toggle: {
      toMagic: "Use a magic link instead",
      toPassword: "Use password instead",
    },
    links: {
      forgot: "Forgot?",
      forgotPage: "Forgot your password?",
      signup: "Create an account",
      login: "Sign in",
    },
    errors: {
      notConfigured: "Auth is not configured.",
      magicSent: "Check your email for a sign-in link.",
    },
  },
  signup: {
    heading: "Create your account",
    subline: "Get the decoder free, or buy an Appeal Pass to draft your POA.",
    submit: "Create account",
    passwordHint: "At least 8 characters.",
    passwordError: "Password must be at least 8 characters.",
    links: {
      login: "Sign in",
    },
    magicSent: "Check your email to confirm your account.",
  },
  forgot: {
    heading: "Forgot your password?",
    submit: "Send reset link",
    sent: "Check your email for a password reset link.",
  },
  reset: {
    heading: "Reset your password",
    submit: "Set new password",
    success: "Your password has been updated.",
  },
} as const;
