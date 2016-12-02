export function shuffle<T>(arr: T[]): void {
    for (var i = arr.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var temp = arr[i];
        arr[i] = arr[j];
        arr[j] = temp;
    }
}

export function mod(num: number, mod: number): number {
    var remain = num % mod;
    return Math.floor(remain >= 0 ? remain : remain + mod);
}