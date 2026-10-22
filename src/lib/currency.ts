/**
 * Memformat angka sebagai Rupee India (INR)
 */
export const formatCurrency = (amount: number, showDecimals: boolean = false) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: showDecimals ? 2 : 0,
    maximumFractionDigits: showDecimals ? 2 : 0,
  }).format(amount);
};

/**
 * Memformat angka dengan format India (lakh, crore)
 */
export const formatNumber = (amount: number) => {
  return new Intl.NumberFormat("en-IN").format(amount);
};
