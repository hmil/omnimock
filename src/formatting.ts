import { fmt } from './matchers';

// TODO: move fmt to this file (watch for circular dependency with matchers)

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
