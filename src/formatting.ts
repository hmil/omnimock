import { isMatcher, MATCHER_KEY } from './matcher';
import { getMetadata } from './metadata';

export function formatArgArray(args: unknown[] | undefined) {
    return (args || []).map(a => fmt`${a}`).join(', ');
}

const IDENTIFIER_RX = /^[$A-Z_][0-9A-Z_$]*$/i;
export function formatPropertyAccess(p: PropertyKey) {
    if (typeof p === 'string') {
        if (IDENTIFIER_RX.test(p)) {
            return `.${p}`;
        }
        return `["${p}"]`;
    }
    return `[${String(p)}]`;
}

export function fmt(strings: TemplateStringsArray, ...values: unknown[]): string {
    return [strings[0], ...values.map((value, i) => formatObjectForHumans(value) + strings[i + 1])].join('');
}

function substitute(_key: string, value: unknown): unknown {
    if (isMatcher(value)) {
        return `<${getMetadata(value, MATCHER_KEY).name}>`;
    }
    if (typeof value === 'object' && value != null) {
        const ctrName = value.constructor.name;
        if (ctrName && ctrName !== 'Object') {
            return ctrName;
        }
    }
    if (typeof value === 'function') {
        // This may be one of our mocks
        return `function ${value.constructor.name}`;
    }
    return value;
}

function formatObjectForHumans(obj: unknown): string {
    return JSON.stringify(substitute('root', obj), substitute);
}
