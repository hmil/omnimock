import { instance, mock, when } from '../src';
import { CatClass } from './fixtures/classes';

describe('error messages', () => {
    
    describe('the base symbol', () => {
            it('uses the custom name of a virtual mock', () => {
                const catMock = mock<CatClass>('virtual cat');
                expect(() => instance(catMock).purr()).toThrow(/<virtual cat>.purr/);
            });

            it('uses the class name of a class-based backed mock', () => {
                const catMock = mock(new CatClass('Olinka'));
                when(catMock.purr()).return(undefined).never();
                expect(() => instance(catMock).purr()).toThrow(/<CatClass>.purr/);
            });

            it('uses "Object" for inline complete mocks', () => {
                const catMock = mock({
                    purr: () => undefined
                });
                when(catMock.purr()).return(undefined).never();
                expect(() => instance(catMock).purr()).toThrow(/<Object>.purr/);
            });

            it('uses the custom name of a partial-backed mock', () => {
                const catMock = mock<CatClass>('virtual cat', {
                    color: 'grey'
                });
                expect(() => instance(catMock).purr()).toThrow(/<virtual cat>.purr/);
            });
    
            it('uses the original name of a function', () => {
                function myAwesomeFunction() {
                    // noop
                }
                const m = mock(myAwesomeFunction);
                expect(() => instance(m)()).toThrow(/<myAwesomeFunction>\(\)/);
            });

            it('uses "Function" for inline function mocks', () => {
                const m = mock(() => undefined);
                expect(() => instance(m)()).toThrow(/<Function>\(\)/);
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
            function myAwesomeFunction() {
                // noop
            }
            const m = mock(myAwesomeFunction);
            expect(() => instance(m)()).toThrow(/Unexpected function call: <myAwesomeFunction>\(\)/);
        });
        it('explains when a member access is called more than expected', () => {
            const catMock = mock(CatClass);
            when(catMock.purr()).return('rrr').once();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow(
                    /<CatClass>.purr\(\) was expected once but was received 2 times./);
        });
    });
});
