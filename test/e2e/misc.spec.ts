import { instance, mock, mockInstance, when } from '../../src';
import { CatClass } from '../fixtures/classes';

describe('JSON stringification', () => {
    it('does not cause unexpected access on virtual mocks', () => {
        const catMock = mock<CatClass>('catMock');
        expect(() => JSON.stringify(instance(catMock))).not.toThrow();
    });
    it('does not cause unexpected access on backed mocks', () => {
        const catMock = mock('catMock', new CatClass('Olinka'));
        expect(() => JSON.stringify(instance(catMock))).not.toThrow();
    });
    it('does not cause unexpected access on partial mocks', () => {
        const catMock = mock<CatClass>('catMock', {
            color: 'blue'
        });
        expect(() => JSON.stringify(instance(catMock))).not.toThrow();
    });
    it('can override expectations on toJSON', () => {
        const catMock = mock<CatClass>('catMock');
        when((catMock as any).toJSON).return(undefined).never();
        expect(() => JSON.stringify(instance(catMock))).toThrow();
    });
});

describe('the mock instance', () => {
    it('is always the same instance', () => {
        const catMock = mock<CatClass>('catMock', {
            color: 'blue'
        });
        // tslint:disable-next-line: no-identical-expressions
        expect(instance(catMock) === instance(catMock)).toBe(true);
        expect(instance(catMock)).toBe(instance(catMock));
    });
});
