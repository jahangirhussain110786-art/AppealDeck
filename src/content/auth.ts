// Copy source for authenticated surfaces.
// AA-29 strings for the auth flow pages.

export const AUTH = {
  login: {
    // v5 (26 Sep 2026, prototype signin.html).
    title: "Sign in to keep your case",
    subtitle: "Free. Add documents and get reminders.",
    subtitleContinue: "Sign in on this tab to keep your guest case and continue.",
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
      togglePassword: "Email me a sign-in link instead",
      toggleMagic: "Use password instead",
      submitPassword: "Sign in",
      submitMagic: "Email me a sign-in link",
      invalidEmail: "Enter a valid email address.",
      // Shown for `?error=` on /login. Only our own words, chosen by reason — the parameter's text
      // is never displayed, because anyone can put any sentence in a link to this page.
      linkFailed:
        "That sign-in link did not work. It may have expired or been used already — sign in again, or request a new link.",
    },
    footer: {
      prompt: "New to AppealDeck?",
      action: "Create an account",
    },
  },
  signup: {
    title: "Create your account",
    subtitle: "Keep your case in an account vault on this device. Creating an account is free.",
    subtitleContinue: "Create an account on this tab to keep your guest case and continue.",
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
      sentDetail:
        "We sent a confirmation link to your inbox. Open it to verify your email, then sign in.",
      backToSignIn: "Back to sign in",
      submit: "Create account",
      invalidEmail: "Enter a valid email address.",
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
    success: {
      whatToDo: "Open the email and follow the link to reset your password.",
      backToSignIn: "Back to sign in",
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
      passwordHint: "At least 8 characters.",
    },
    messages: {
      notConfigured: "Auth is not configured.",
      weakPassword: "Password must be at least 8 characters.",
      mismatch: "Passwords do not match.",
      updated: "Your password has been updated.",
      submit: "Update password",
    },
    success: {
      button: "Go to your dashboard",
    },
    footer: {
      prompt: "Remembered it?",
      action: "Sign in",
    },
  },
  preview: {
    dueIn: "Reply due in",
    // The panel shows made-up case data, so it says so (v5 prototype signin.html).
    eyebrow: "Sample data",
    title: "Come back to exactly where you stopped.",
    accent: "stopped.",
    description:
      "Understand the request. Organize your evidence. Prepare a response you can review.",
  },
} as const;
