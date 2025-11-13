export const formatCurrency = (num: number) =>
  num.toLocaleString(undefined, { style: "currency", currency: "PKR", maximumFractionDigits: 2 });

export const formatDate = (iso?: string) => {
  if (!iso) return "";
  const d = new Date(iso);
  return d.toLocaleDateString();
};
