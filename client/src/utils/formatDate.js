import { format, formatDistance, formatRelative, parseISO } from 'date-fns';

const dateUtils = {
  // Format date to 'dd MMM yyyy'
  standard(date) {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy');
  },

  // Format date to 'dd MMM yyyy, hh:mm a'
  withTime(date) {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy, hh:mm a');
  },

  // Format date to relative time (e.g., '2 days ago')
  relative(date) {
    if (!date) return 'N/A';
    return formatDistance(new Date(date), new Date(), { addSuffix: true });
  },

  // Format date for input fields (yyyy-MM-dd)
  forInput(date) {
    if (!date) return '';
    return format(new Date(date), 'yyyy-MM-dd');
  },

  // Format date for display with time
  displayDateTime(date) {
    if (!date) return 'N/A';
    return format(new Date(date), 'dd MMM yyyy • hh:mm a');
  },

  // Format date for invoices and reports
  formal(date) {
    if (!date) return 'N/A';
    return format(new Date(date), 'MMMM dd, yyyy');
  },

  // Format date for sorting
  forSorting(date) {
    if (!date) return '';
    return format(new Date(date), 'yyyyMMdd');
  },

  // Calculate and format date difference
  dateDifference(startDate, endDate) {
    if (!startDate || !endDate) return 'N/A';
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end - start);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return `${diffDays} day${diffDays !== 1 ? 's' : ''}`;
  },

  // Format date for file names
  forFileName() {
    return format(new Date(), 'yyyy-MM-dd_HH-mm-ss');
  },

  // Parse ISO string to date
  parseISO(isoString) {
    if (!isoString) return null;
    return parseISO(isoString);
  },

  // Check if date is valid
  isValid(date) {
    return date instanceof Date && !isNaN(date);
  },

  // Format time ago
  timeAgo(date) {
    if (!date) return 'N/A';
    const now = new Date();
    const past = new Date(date);
    const seconds = Math.floor((now - past) / 1000);
    
    let interval = seconds / 31536000;
    if (interval > 1) {
      return Math.floor(interval) + ' years ago';
    }
    
    interval = seconds / 2592000;
    if (interval > 1) {
      return Math.floor(interval) + ' months ago';
    }
    
    interval = seconds / 86400;
    if (interval > 1) {
      return Math.floor(interval) + ' days ago';
    }
    
    interval = seconds / 3600;
    if (interval > 1) {
      return Math.floor(interval) + ' hours ago';
    }
    
    interval = seconds / 60;
    if (interval > 1) {
      return Math.floor(interval) + ' minutes ago';
    }
    
    return Math.floor(seconds) + ' seconds ago';
  },
};

// Provide a callable default function that returns the standard format,
// but also expose all utility methods as properties for backward compatibility.
function formatDate(date) {
  return dateUtils.standard(date);
}

// Copy helper methods onto the function
Object.keys(dateUtils).forEach((key) => {
  formatDate[key] = dateUtils[key];
});

export { formatDate };
export default formatDate;