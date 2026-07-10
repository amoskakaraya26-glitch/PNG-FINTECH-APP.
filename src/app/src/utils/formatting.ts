export const formatCurrency = (value: number | string, currency: string = 'PGK'): string => {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  return new Intl.NumberFormat('en-PG', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(num);
};

export const formatDate = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-PG', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-PG', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).format(d);
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/^(\d{3})(\d{3})(\d{4})$/, '+675 $1 $2 $3');
};
