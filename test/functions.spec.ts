import { mock, when, instance } from "../src";

describe('mocking functions', () => {

    // This use-case is fairly limited but it is a good stress test for the framework.
    it('allows setting fake value', () => {
        const virtualMock = mock<() => string>();
        when(virtualMock()).return('virtual');
        expect(instance(virtualMock)()).toBe('virtual');
    });
});
