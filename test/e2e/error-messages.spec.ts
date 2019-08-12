import { instance, mock, when } from '../../src';
import { CatClass, CatsSecretPlan } from '../fixtures/classes';

describe('error messages', () => {
    
    describe('the base symbol', () => {
            it('uses the custom name of a virtual mock', () => {
                const catMock = mock<CatClass>('virtual cat');
                expect(() => instance(catMock).purr()).toThrow(/<virtual cat>.purr/);
            });

            it('uses the class name of a class-based backed mock', () => {
                const catMock = mock('catMock', new CatClass('Olinka'));
                when(catMock.purr()).return(undefined).never();
                expect(() => instance(catMock).purr()).toThrow(/<catMock>.purr/);
            });

            it('uses "Anonymous class" for anonymous classes', () => {
                const catMock = mock(class { purr() { return 'a'; }});
                expect(() => instance(catMock).purr()).toThrow(/<anonymous class>.purr/);
            });

            it('uses "Object" for inline complete mocks', () => {
                const catMock = mock('catMock', {
                    purr: () => undefined
                });
                when(catMock.purr()).return(undefined).never();
                expect(() => instance(catMock).purr()).toThrow(/<catMock>.purr/);
            });

            it('uses the custom name of a partial-backed mock', () => {
                const catMock = mock<CatClass>('virtual cat', {
                    color: 'grey'
                });
                expect(() => instance(catMock).purr()).toThrow(/<virtual cat>.purr/);
            });
    
            it('uses the original name of a class', () => {
                const catMock = mock(CatClass);
                expect(() => instance(catMock).purr()).toThrow(/<CatClass>.purr/);
            });
    });

    describe('unexpected calls', () => {
        it('explains when a member access is unexpected', () => {
            const catMock = mock(CatClass);
            expect(() => instance(catMock).purr()).toThrow(/Unexpected property access: <CatClass>.purr/);
        });
        it('explains when a method call is unexpected', () => {
            const m = mock<() => void>('m');
            expect(() => instance(m)()).toThrow(/Unexpected function call: <m>\(\)/);
        });
        it('explains when a member access is called more than expected', () => {
            const catMock = mock(CatClass);
            when(catMock.purr()).return('rrr').once();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow(
                    /<CatClass>.purr\(\) was expected once but was received 2 times./);
        });
    });

    describe('array indices', () => {
        it('says which index was accessed', () => {
            const m = mock<string[]>('arrayMock');
            expect(() => instance(m)[3]).toThrow(/Unexpected property access: <arrayMock>\["3"\]/);
        });
    });

    describe('symbols', () => {
        it('specifies the symbol used', () => {
            const catMock = mock(CatClass);
            expect(() => instance(catMock)[CatsSecretPlan])
                    .toThrow(/Unexpected property access: <CatClass>\[Symbol\(secret plan\)\]/);
        });
    });
});
