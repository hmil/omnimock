import { isMatcher, MATCHER_KEY } from './matcher';
import { getMetadata } from './metadata';


export function formatArgArray(args: unknown[] | undefined) {
    return (args || []).map(a => fmt`${a}`).join(', ')
}

const IDENTIFIER_RX = /^[$A-Z_][0-9A-Z_$]*$/i;
export function humanReadableObjectPropertyAccess(name: string) {
    if (IDENTIFIER_RX.test(name)) {
        return `.${name}`;
    }
    return `["${name}"]`;
}

export function fmt(strings: TemplateStringsArray, ...values: unknown[]): string {
    return [strings[0], ...values.map((value, i) => formatObjectForHumans(value) + strings[i + 1])].join('');
}

function substitute(_key: string, obj: unknown): unknown {
    if (isMatcher(obj)) {
        return `<${getMetadata(obj, MATCHER_KEY).name}>`;
    }
    if (typeof obj === 'object' && obj != null) {
        const ctrName = obj.constructor.name;
        if (ctrName && ctrName !== 'Object') {
            return ctrName;
        }
    }
    if (typeof obj === 'function') {
        // This may be one of our mocks
        return `function ${obj.constructor.name}`;
    }
    return obj;
}

function formatObjectForHumans(obj: unknown): string {
    return JSON.stringify(substitute('root', obj), substitute);
}
