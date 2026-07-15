export const formatNumberInput = (value: string): string => {
  if (!value) return "";
  
  // Clean characters: only allow digits, dots, and commas
  let clean = value.replace(/[^0-9.,]/g, "");
  
  // Convert trailing dot to comma to make decimal entry intuitive (e.g., "20000." -> "20000,")
  if (clean.endsWith(".")) {
    clean = clean.slice(0, -1) + ",";
  }
  
  // We identify the decimal part by looking for a comma (,).
  // Comma is the standard Indonesian decimal separator.
  let hasComma = clean.includes(",");
  let integerPart = clean;
  let fractionalPart = "";
  
  if (hasComma) {
    const parts = clean.split(",");
    integerPart = parts[0];
    fractionalPart = parts.slice(1).join("");
  }
  
  // Strip all non-digits (like existing dots) from the integer part
  const cleanInt = integerPart.replace(/\D/g, "");
  
  if (!cleanInt) {
    return hasComma ? "0," + fractionalPart : "";
  }
  
  // Format the integer part with thousands separators (dots) for Indonesian locale
  const formattedInt = parseInt(cleanInt, 10).toLocaleString("id-ID");
  
  return hasComma ? formattedInt + "," + fractionalPart : formattedInt;
};

export const parseNumberInput = (value: string): number => {
  if (!value) return 0;
  
  let clean = value;
  
  if (clean.includes(",")) {
    clean = clean.replace(/\./g, "").replace(/,/g, ".");
  } else {
    const dotCount = (clean.match(/\./g) || []).length;
    if (dotCount === 1) {
      const parts = clean.split(".");
      if (parts[1].length === 3) {
        clean = clean.replace(/\./g, "");
      } else {
        clean = clean.replace(/\./g, ".");
      }
    } else {
      clean = clean.replace(/\./g, "");
    }
  }
  
  const num = parseFloat(clean);
  return isNaN(num) ? 0 : num;
};
