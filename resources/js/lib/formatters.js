export function formatCurrency(value) {
  return `₱${Number(value).toLocaleString('en-PH', { minimumFractionDigits: 0 })}`;
}

export function formatKpiValue(kpi) {
  if (kpi.format === 'currency') return formatCurrency(kpi.value);
  if (kpi.format === 'number') return Number(kpi.value).toLocaleString();
  return kpi.value;
}
