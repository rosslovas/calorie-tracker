export function formatNumber(number: string, digits = 0, multiply = 1) {
    const n = parseFloat(number);
    const e = 10 ** digits;
    const multiplier = multiply * e;
    const str = (Math.round((n + Number.EPSILON) * multiplier) / e).toFixed(digits);
    let trailingZeroes;
    if (digits > 0 && ((trailingZeroes = str.match(/0+$/)?.[0]?.length || 0) > 1)) {
        return str.slice(0, -(trailingZeroes - 1));
    }
    return str;
}
