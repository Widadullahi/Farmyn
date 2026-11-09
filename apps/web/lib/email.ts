export const normalizeEmail = (value: string) => value.trim().toLowerCase();

export const isValidEmail = (value: string) => {
  const normalized = normalizeEmail(value);
  if (normalized.length > 254 || /[\s\u0000-\u001f\u007f<>]/.test(normalized)) return false;
  const parts = normalized.split("@");
  if (parts.length !== 2) return false;
  const [local, domain] = parts;
  if (!local || local.length > 64 || local.startsWith(".") || local.endsWith(".") || local.includes("..") || !domain.includes(".")) return false;
  return /^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$/i.test(normalized);
};

export const emailInputProps = {
  type: "email" as const,
  inputMode: "email" as const,
  autoComplete: "email",
  autoCapitalize: "none" as const,
  spellCheck: false,
  maxLength: 254,
};
