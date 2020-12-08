import { formatPropertyAccess, indent } from '../formatting';
import { Range } from '../range';
import { BehaviorMatchResult } from './MockExpectations';

export function reportFunctionCallError(
        callSignature: string,
        match: BehaviorMatchResult<any, any>,
        hasBackingObject: 'yes' | 'no' | 'does not matter'): never {
    const backingInstanceInfo = hasBackingObject ?
            'The backing object is not a function' :
            'This mock is not backed';

    let messageBuilder = `Unexpected call: ${callSignature}\n`;

    if (match.matched) {
        messageBuilder += `\nThe following behavior matched, ` +
                `but that behavior was expected ${match.matched.expectedCalls} ` +
                `and was received ${new Range(match.matched.actualCalls.length)}.\n`;

        messageBuilder += match.matched.getSignature() + '\n';

        if (match.matched.actualCalls.length > 0) {
            messageBuilder += `\nPrevious matching calls were:\n`;

            messageBuilder += match.matched.actualCalls
                    .map((actual, i) => `${i}. ${actual.signature}\n`).join('');
        }
    }

    if (match.unmatched.length > 0) {
        messageBuilder += '\nThe following behaviors were tested but they did not match:\n\n';
        messageBuilder += match.unmatched.map(unmatched =>
            `- ${unmatched.expectation.toString()}\n` + 
            `  reason: ${indent(unmatched.reason)}\n`
        ).join('\n');
    } else {
        messageBuilder += `No call behavior was defined on this symbol.\n`;
    }

    if (match.remaining.length > 0) {
        messageBuilder += '\nThese behaviors were not tested because ' +
                `the matching call was defined first and therefore had precendence.\n`;

        messageBuilder += match.remaining.map(remaining => `- ${remaining.getSignature()}\n`).join('');
    }

    messageBuilder += '\n\n' + backingInstanceInfo;

    doFail(messageBuilder);
}

export function reportMemberAccessError(
        signature: string,
        membersWithBehavior: PropertyKey[],
        match: BehaviorMatchResult<any, any> | undefined,
        getBacking: (() => any) | undefined): never {


    let messageBuilder = `Unexpected property access: ${signature}\n`;

    if (match !== undefined && match.matched !== undefined) {
        messageBuilder += `\nThe following behavior matched, ` +
                `but that behavior was expected ${match.matched.expectedCalls} ` +
                `and was received ${match.matched.actualCalls.length}.\n`;
    }

    if (membersWithBehavior.length > 0) {
        messageBuilder += '\nBehviors were defined for the following members:\n';
        messageBuilder += membersWithBehavior.map(m => `- ${formatPropertyAccess(m)}\n`).join('');
    }

    if (getBacking != null) {
        messageBuilder += '\nThe backing instance has the following properties defined:\n';
        messageBuilder += [...Object.getOwnPropertyNames(getBacking()), ...Object.getOwnPropertySymbols(getBacking())]
                .map(key => `- ${formatPropertyAccess(key)}\n`)
                .join('');
    } else {
        messageBuilder += 'This mock is not backed';
    }

    doFail(messageBuilder);
}

let customFail: ((message: string) => never) | undefined;
function doFail(message: string): never {
    // The double if is written like this such that doing `setCustomFail(null)` disables the fail function
    if (customFail !== undefined) {
        if (typeof customFail === 'function') {
            customFail(message);
        }
    } else if (typeof fail === 'function') {
        fail(message);
    }
    throw new Error(message);
}
export function setCustomFail(fail: ((message: string) => never) | undefined) {
    customFail = fail;
}

