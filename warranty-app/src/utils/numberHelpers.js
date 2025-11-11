import i18n from '../i18n';

export const formatCurrency = (amount, currency = 'RSD') => {
  if (!amount && amount !== 0) return '';
  
  const currentLang = i18n.language;
  const locale = currentLang.startsWith('sr') ? 'sr-RS' : 'en-US';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

export const formatNumber = (number) => {
  if (!number && number !== 0) return '';
  
  const currentLang = i18n.language;
  const locale = currentLang.startsWith('sr') ? 'sr-RS' : 'en-US';
  
  return new Intl.NumberFormat(locale).format(number);
};

// Format price with thousands separator and 2 decimal places (e.g., 10,000.00)
export const formatPrice = (price) => {
  if (!price && price !== 0) return '';
  
  const numValue = typeof price === 'string' ? parseFloat(price.replace(/,/g, '')) : price;
  if (isNaN(numValue)) return '';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true
  }).format(numValue);
};

// Parse formatted price string back to number (removes commas and converts to float)
export const parsePrice = (formattedPrice) => {
  if (!formattedPrice) return '';
  // Remove all commas and spaces, keep only numbers and decimal point
  const cleaned = formattedPrice.toString().replace(/[^\d.]/g, '');
  // Handle multiple decimal points (keep only the first one)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    return parts[0] + '.' + parts.slice(1).join('');
  }
  return cleaned;
};

// Format price for display while typing (handles partial input)
export const formatPriceInput = (value) => {
  if (!value) return '';
  
  // Remove all non-numeric characters except decimal point
  const cleaned = value.toString().replace(/[^\d.]/g, '');
  
  // Handle multiple decimal points
  const parts = cleaned.split('.');
  let formatted = parts[0];
  
  // Add thousands separators
  if (formatted) {
    formatted = formatted.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }
  
  // Add decimal part if exists
  if (parts.length > 1) {
    formatted += '.' + parts[1].substring(0, 2); // Limit to 2 decimal places
  }
  
  return formatted;
};

