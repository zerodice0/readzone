type DisplayNameUser = {
  unsafeMetadata?: Record<string, unknown> | null;
  username?: string | null;
};

function normalizeDisplayName(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const displayName = value.trim();
  return displayName || undefined;
}

export function getUserNickname(user: DisplayNameUser | null | undefined) {
  return normalizeDisplayName(user?.unsafeMetadata?.displayName);
}

export function getUserDisplayName(user: DisplayNameUser | null | undefined) {
  return getUserNickname(user) ?? user?.username ?? '사용자';
}

export function getUnsafeMetadataWithDisplayName(
  unsafeMetadata: Record<string, unknown> | null | undefined,
  displayName: string
) {
  const nextUnsafeMetadata = { ...(unsafeMetadata ?? {}) };
  const nextDisplayName = normalizeDisplayName(displayName);

  if (nextDisplayName) {
    nextUnsafeMetadata.displayName = nextDisplayName;
  } else {
    delete nextUnsafeMetadata.displayName;
  }

  return nextUnsafeMetadata;
}
