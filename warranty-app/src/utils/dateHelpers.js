import { format, formatDistance, parseISO } from 'date-fns';
import { sr, enUS } from 'date-fns/locale';
import i18n from '../i18n';

const getLocale = () => {
  const currentLang = i18n.language;
  if (currentLang.startsWith('sr')) {
    return sr;
  }
  return enUS;
};

export const formatDate = (date, formatStr = 'PP') => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return format(dateObj, formatStr, { locale: getLocale() });
};

export const formatDateString = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

export const getDaysUntilExpiry = (endDate) => {
  if (!endDate) return null;
  const today = new Date();
  const expiry = new Date(endDate);
  const diffTime = expiry - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

export const isWarrantyExpired = (endDate) => {
  if (!endDate) return false;
  const today = new Date();
  const expiry = new Date(endDate);
  return expiry < today;
};

export const getWarrantyStatus = (endDate) => {
  if (!endDate) return 'unknown';
  const daysUntil = getDaysUntilExpiry(endDate);
  
  if (daysUntil < 0) return 'expired';
  if (daysUntil <= 7) return 'expiring_soon';
  if (daysUntil <= 30) return 'expiring_soon';
  return 'active';
};

export const formatRelativeDate = (date) => {
  if (!date) return '';
  const dateObj = typeof date === 'string' ? parseISO(date) : date;
  return formatDistance(dateObj, new Date(), { 
    addSuffix: true, 
    locale: getLocale() 
  });
};

export const getLocalizedDateFormat = () => {
  const currentLang = i18n.language;
  if (currentLang.startsWith('sr')) {
    return 'dd.MM.yyyy';
  }
  return 'MM/dd/yyyy';
};

