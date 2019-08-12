import { mock, when, instance } from '../../src';
import { CatClass } from '../fixtures/classes';

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
});
