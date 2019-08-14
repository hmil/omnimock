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

export function formatSignature(path: string, args: unknown[] | undefined) {
    return path + (args === undefined ? '' : `(${formatArgArray(args)})`);
}

export function makeConstructorPath(path: string) {
    if (path.indexOf('(') >= 0) {
        return `new (${path})`;
    }
    return `new ${path}`;
}

export function fmt(strings: TemplateStringsArray, ...values: unknown[]): string {
    return [strings[0], ...values.map((value, i) => formatObjectForHumans(value) + strings[i + 1])].join('');
}

const MAX_STRING_LENGTH = 80;

function truncate(s: string): string {
    if (s.length > MAX_STRING_LENGTH) {
        return s.substr(0, MAX_STRING_LENGTH) + '…';
    }
    return s;
}

function formatObjectForHumans(obj: unknown): string {
    switch (typeof obj) {
        case 'string':
            return truncate(`"${obj}"`);
        case 'symbol':
            return `Symbol("${String(obj)}")`;
        case 'function':
            return `function ${obj.name}`;
        case 'object':
            if (obj === null) {
                return 'null';
            }
            if (isMatcher(obj)) {
                return `<${getMetadata(obj, MATCHER_KEY).name}>`;
            }
            // Only use toString if it's not the default one (which returns [Object object])
            if ('toString' in obj && typeof obj.toString === 'function' && obj.toString !== Object.prototype.toString) {
                return obj.toString();
            }
            return `Object(${
                [...Object.getOwnPropertyNames(obj), ...Object.getOwnPropertySymbols(obj)]
                        .map(key => String(key))
                        .join(',')
                })`;
        default:
            return truncate(String(obj));
    }
}

export function indent(message: string): string {
    return message.replace(/\n/g, '\n  ');
}
