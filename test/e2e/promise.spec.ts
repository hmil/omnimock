import { instance, mock, when, mockInstance } from '../../src';

describe('promise helpers', () => {

    it('resolves a promise', async () => {
        const myMock = mock<() => Promise<string>>('myMock');
        when(myMock()).resolve('yes');
        expect(await instance(myMock)()).toBe('yes');
    });

    it('rejects a promise', async () => {
        const myMock = mock<() => Promise<string>>('myMock');
        when(myMock()).reject('no');
        try {
            await instance(myMock)();
            fail();
        } catch (e) {
            expect(e).toBe('no');
        }
    });

    it('can resolve with a mock instance', async () => {
        const myMock = mock<() => Promise<string>>('myMock');
        const value = mockInstance<string>('value');
        when(myMock()).resolve(value);
        expect(await instance(myMock)()).toBe(value);
    });
});
