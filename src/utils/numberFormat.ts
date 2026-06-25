export const formatNumberInput = (value: string): string => {
  const numericValue = value.replace(/\D/g, "");
  if (!numericValue) return "";
  return parseInt(numericValue, 10).toLocaleString("id-ID");
};

export const parseNumberInput = (value: string): number => {
  if (!value) return 0;
  const num = parseInt(value.replace(/\./g, ""), 10);
  return isNaN(num) ? 0 : num;
};
