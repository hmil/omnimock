import { instance, mock, when } from '../../src';

describe('arrays', () => {

    it('can mock arbitrary indices', () => {
        const arryMock = mock<string[]>('arryMock');

        when(arryMock[2]).useValue('incredible');

        expect(instance(arryMock)[2]).toBe('incredible');
        expect(() => instance(arryMock)[0]).toThrow(/Unexpected/);
    });
});
