import { type User } from '@/lib/api/auth';

/**
 * Get a user's display name, falling back to safe alternatives
 * Never returns the user ID
 */
export function getUserDisplayName(user: User | null | undefined): string {
  if (!user) {
    return 'Anonymous User';
  }

  // Priority order for display name
  if (user.displayName?.trim()) {
    return user.displayName.trim();
  }

  if (user.firstName || user.lastName) {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  }

  if (user.username?.trim()) {
    return user.username.trim();
  }

  if (user.email?.trim()) {
    // Use email prefix instead of full email for privacy
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix || 'User';
  }

  // Fallback - never show ID
  return 'User';
}

/**
 * Get user initials for avatar fallback
 */
export function getUserInitials(user: User | null | undefined): string {
  if (!user) {
    return 'AU';
  }

  // Try display name first
  if (user.displayName?.trim()) {
    const words = user.displayName.trim().split(' ');
    if (words.length >= 2) {
      return `${words[0].charAt(0)}${words[1].charAt(0)}`.toUpperCase();
    }
    return user.displayName.substring(0, 2).toUpperCase();
  }

  // Try first/last name
  if (user.firstName || user.lastName) {
    const first = user.firstName?.charAt(0) || '';
    const last = user.lastName?.charAt(0) || '';
    return `${first}${last}`.toUpperCase() || 'U';
  }

  // Try username
  if (user.username?.trim()) {
    return user.username.substring(0, 2).toUpperCase();
  }

  // Try email prefix
  if (user.email?.trim()) {
    const emailPrefix = user.email.split('@')[0];
    return emailPrefix.substring(0, 2).toUpperCase();
  }

  return 'U';
}

/**
 * Get user's email for display (safe to show)
 */
export function getUserEmail(user: User | null | undefined): string {
  if (!user?.email) {
    return 'No email';
  }
  return user.email;
}

/**
 * Check if user has completed profile setup
 */
export function hasCompletedProfile(user: User | null | undefined): boolean {
  if (!user) {
    return false;
  }
  
  return Boolean(user.displayName?.trim());
}