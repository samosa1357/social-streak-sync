export const getEmailPrefix = (email?: string | null) =>
  (email?.split('@')[0] ?? '').trim().toLowerCase();

export const isValidUsername = (
  displayName: string | null | undefined,
  email?: string | null
) => {
  const name = (displayName ?? '').trim();
  if (!name) return false;
  if (name.includes('@')) return false;

  const emailPrefix = getEmailPrefix(email);
  if (!emailPrefix) return true;

  // Consider auto-generated email prefix as "not set" to force a real username.
  return name.toLowerCase() !== emailPrefix;
};

export const isEmailPrefixUsername = (username: string, email?: string | null) => {
  const emailPrefix = getEmailPrefix(email);
  return !!emailPrefix && username.trim().toLowerCase() === emailPrefix;
};
