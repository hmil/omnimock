export function fmt(strings: TemplateStringsArray, ...values: unknown[]): string {
    const result = [strings[0]];
    let i = 1;
    for (const value of values) {
        result.push(typeof value !== 'string' ? formatObjectForHumans(value) : value, strings[i++]);
    }
    return result.join('');
}

function formatObjectForHumans(obj: unknown): string {
    if (typeof obj === 'object' && obj != null) {
        const ctrName = obj.constructor.name;
        if (ctrName && ctrName !== 'Object') {
            return ctrName;
        }
    }
    return JSON.stringify(obj);
}
