export function sanitizeAlpha(value) {
  return value.replace(/[^A-Za-z\s]/g, '');
}

export function sanitizeNumeric(value) {
  return value.replace(/[^0-9]/g, '');
}

export function sanitizeMoney(value) {
  return value
    .replace(/[^0-9.]/g, '')
    .replace(/(\..*)\./g, '$1');
}

export function sanitizeContact(value) {
  return value.replace(/[^0-9]/g, '').slice(0, 11);
}

export function isStrongPassword(value) {
  return /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/.test(value);
}

export function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function isValidContactNumber(value) {
  return /^09\d{9}$/.test(value);
}
