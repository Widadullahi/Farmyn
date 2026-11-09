export const cleanPhoneInput = (value: string) => {
  const cleaned = value.replace(/[^\d+\s()-]/g, "");
  return cleaned.startsWith("+") ? `+${cleaned.slice(1).replace(/\+/g, "")}` : cleaned.replace(/\+/g, "");
};

export const normalizeNigerianPhone = (value: string) => {
  const compact = cleanPhoneInput(value).replace(/[\s()-]/g, "");
  if (/^0\d{10}$/.test(compact)) return `+234${compact.slice(1)}`;
  if (/^234\d{10}$/.test(compact)) return `+${compact}`;
  return compact;
};

export const isValidNigerianPhone = (value: string) => /^\+234(?:70|80|81|90|91)\d{8}$/.test(normalizeNigerianPhone(value));

export const phoneInputProps = {
  type: "tel" as const,
  inputMode: "tel" as const,
  autoComplete: "tel",
  maxLength: 20,
};
