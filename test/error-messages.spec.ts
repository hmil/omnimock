import { instance, mock, when } from '../src';
import { CatClass } from './fixtures/classes';

describe('error messages', () => {
    
    describe('the base symbol', () => {
            it('has a default for virtual mocks', () => {
                const catMock = mock<CatClass>();
                expect(() => instance(catMock).purr()).toThrow(/<virtual mock>.purr/);
            });
        
            it('uses the custom name', () => {
                const catMock = mock<CatClass>('virtual cat');
                expect(() => instance(catMock).purr()).toThrow(/<virtual cat>.purr/);
            });
        
            it('uses the original name of a function', () => {
                function myAwesomeFunction() {
                    // noop
                }
                const m = mock(myAwesomeFunction);
                expect(() => instance(m)()).toThrow(/<myAwesomeFunction>\(\)/);
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
