import { CatClass } from "./fixtures/classes";
import { mock, instance, when } from "../src";

describe('Expectation quantifiers', () => {

    describe('.atLeastOnce()', () => {
        it('asserts at least one call', () => {
            const catMock = mock(CatClass, 'Olinka');
            const cat = instance(catMock);

            // TODO: Are we saving untyped state in the mock to allow both forms to work?
            // Or are we typing the fact that a return value was provided, and use that fact in the quantifiers?
            // How about `when(catMock.purr()).once()` (assuming purr is () => undefined)? -> Make this invalid?
            // With option 2: encode the fact that the return value currently provided is undefined, and the expected return value is undefined.
            // So ExpectationSetter would have 2 type params: the captured call, and the state of the setter... But in the current impl. 
            // the setter is stateless.
            // when(catMock.purr()).return('hoyhoy').once();
            // when(catMock.purr()).once().return('hoyhoy');
        });

        it('asserts at least one member access', () => {

        });
    });

    describe('.atMostOnce()', () => {
        it('asserts at most one call', () => {

        });

        it('asserts at most one member access', () => {

        });
    });

    describe('.once()', () => {
        it('asserts exactly one call', () => {

        });

        it('asserts exactly one member access', () => {

        });
    });

    describe('.times(n)', () => {
        it('asserts an arbitrary number of calls', () => {

        });

        it('asserts an arbitrary number of member accesses', () => {

        });
    })
});
