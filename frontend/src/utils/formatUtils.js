// Utility functions for date and time formatting
export const formatRelativeTime = (dateString) => {
  if (!dateString) return '';

  // Ensure UTC dates are parsed correctly - add Z if missing timezone info
  let date;
  if (dateString.includes('T') && !dateString.includes('+') && !dateString.endsWith('Z')) {
    // ISO format without timezone - assume UTC and add Z
    date = new Date(dateString + 'Z');
  } else {
    // Already has timezone info or is already properly formatted
    date = new Date(dateString);
  }

  const now = new Date();
  const diffInMs = now - date;
  const diffInHours = diffInMs / (1000 * 60 * 60);
  const diffInDays = diffInMs / (1000 * 60 * 60 * 24);
  const diffInWeeks = diffInDays / 7;
  const diffInMonths = diffInDays / 30;
  const diffInYears = diffInDays / 365;

  // Handle very recent times more accurately
  if (diffInHours < 1) {
    const minutes = Math.floor(diffInMs / (1000 * 60));
    if (minutes < 1) {
      return 'Just now';
    }
    return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
  }

  if (diffInHours < 24) {
    const hours = Math.floor(diffInHours);
    return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
  } else if (diffInDays < 7) {
    const days = Math.floor(diffInDays);
    return days === 1 ? '1 day ago' : `${days} days ago`;
  } else if (diffInWeeks < 4) {
    const weeks = Math.floor(diffInWeeks);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
  } else if (diffInMonths < 12) {
    const months = Math.floor(diffInMonths);
    return months === 1 ? '1 month ago' : `${months} months ago`;
  } else {
    const years = Math.floor(diffInYears);
    return years === 1 ? '1 year ago' : `${years} years ago`;
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
    'poor': 'Poor',
    'used': 'Used'
  };

  return conditionMap[condition] || condition.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};
