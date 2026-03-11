export const INR_SYMBOL = "\u20B9";
export const FREE_SHIPPING_THRESHOLD = 5000;
export const SHIPPING_FEE = 99;
export const GST_RATE = 0.18;

const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
});

export function formatCurrency(value: number) {
    const numeric = Number.isFinite(value) ? value : 0;
    return currencyFormatter.format(numeric);
}

export function formatCurrencyDifference(value: number) {
    if (value <= 0) return formatCurrency(0);
    return formatCurrency(value);
}

export function parsePriceValue(value: number | string | null | undefined) {
    if (typeof value === "number") {
        return Number.isFinite(value) ? value : 0;
    }

    if (typeof value === "string") {
        const normalized = value.replace(/[^0-9.-]/g, "");
        const parsed = Number.parseFloat(normalized);
        return Number.isFinite(parsed) ? parsed : 0;
    }

    return 0;
}
