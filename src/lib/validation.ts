const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function isValidEmail(value: string): boolean {
  return EMAIL_REGEX.test(value);
}

export function validatePasswordLength(value: string): string {
  if (value.length > 0 && value.length < 8) {
    return "Password must be at least 8 characters.";
  }
  return "";
}
