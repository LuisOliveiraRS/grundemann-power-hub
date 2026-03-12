/**
 * Normalizes a Brazilian phone number for WhatsApp links.
 * Strips non-digits, ensures country code 55, no duplicates.
 */
export const normalizeWhatsAppPhone = (phone: string | null | undefined): string => {
  if (!phone) return "";
  // Remove all non-digit characters
  let clean = phone.replace(/\D/g, "");
  // Remove leading 55 if present (we'll add it back)
  if (clean.startsWith("55") && clean.length >= 12) {
    clean = clean.slice(2);
  }
  // Must have at least 10 digits (DDD + number)
  if (clean.length < 10) return "";
  return `55${clean}`;
};

/**
 * Builds a full WhatsApp URL with optional message.
 */
export const buildWhatsAppUrl = (phone: string | null | undefined, message?: string): string | null => {
  const normalized = normalizeWhatsAppPhone(phone);
  if (!normalized) return null;
  const base = `https://wa.me/${normalized}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};
