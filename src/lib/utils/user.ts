// Utility functions for user display
export interface UserDisplayData {
  displayName?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  username: string;
}

/**
 * Get the preferred display name for a user
 * Priority: displayName > firstName lastName > username
 */
export function getDisplayName(user: UserDisplayData): string {
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }
  
  const fullName = [user.firstName?.trim(), user.lastName?.trim()]
    .filter(Boolean)
    .join(' ');
  
  if (fullName) {
    return fullName;
  }
  
  return user.username;
}

/**
 * Get initials for avatar display
 */
export function getInitials(user: UserDisplayData): string {
  const displayName = getDisplayName(user);
  
  // If it's a username (no spaces), take first 2 characters
  if (!displayName.includes(' ')) {
    return displayName.slice(0, 2).toUpperCase();
  }
  
  // For names with spaces, take first letter of each word (max 2)
  return displayName
    .split(' ')
    .slice(0, 2)
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase();
}