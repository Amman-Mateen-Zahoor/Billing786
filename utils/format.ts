export const formatCurrency = (num: number) =>
  num.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 2 });

export const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString();
};
