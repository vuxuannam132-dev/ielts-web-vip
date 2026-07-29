export function calculateIELTSOverallBand(r: number, l: number, w: number, s: number): number {
    const avg = (r + l + w + s) / 4;
    const decimal = avg - Math.floor(avg);
    if (decimal < 0.25) return Math.floor(avg);
    if (decimal < 0.75) return Math.floor(avg) + 0.5;
    return Math.floor(avg) + 1.0;
}
