// Utility functions for date and time formatting
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  let date;
  // Ensure UTC dates are parsed correctly - add Z if missing timezone info
  if (dateString.includes('T') && !dateString.includes('+') && !dateString.endsWith('Z')) {
    date = new Date(dateString + 'Z');
  } else {
    date = new Date(dateString);
  }

  const now = new Date();
  const diffInMs = now - date;
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return diffInMinutes === 1 ? '1 minute ago' : `${diffInMinutes} minutes ago`;
  } else if (diffInHours < 24) {
    return diffInHours === 1 ? '1 hour ago' : `${diffInHours} hours ago`;
  } else if (diffInDays < 7) {
    return diffInDays === 1 ? '1 day ago' : `${diffInDays} days ago`;
  } else if (diffInYears >= 1) {
    return diffInYears === 1 ? '1 year ago' : `${diffInYears} years ago`;
  } else if (diffInMonths >= 1) {
    return diffInMonths === 1 ? '1 month ago' : `${diffInMonths} months ago`;
  } else if (diffInWeeks >= 1) {
    return diffInWeeks === 1 ? '1 week ago' : `${diffInWeeks} weeks ago`;
  } else {
    return 'Just now'; // Fallback
  }
};

// Utility function to format condition display
export const formatCondition = (condition) => {
  if (!condition) return 'Not specified';

  const conditionMap = {
    'new': 'New',
    'like_new': 'Like New',
    'good': 'Good',
    'fair': 'Fair',
    'used': 'Used'
  };

  return conditionMap[condition] || condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Export as object
export const formatUtils = {
  timeAgo: formatRelativeTime,
  formatRelativeTime,
  formatCondition
};
