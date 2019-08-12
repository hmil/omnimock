import { instance, mock, when } from '../../src';
import { CatClass, CatsSecretPlan } from '../fixtures/classes';

describe('symbol access', () => {
    it('can mock symbol-based access', () => {
        const m = mock(CatClass);
        when(m[CatsSecretPlan]).return('noooo');
        expect(instance(m)[CatsSecretPlan]).toBe('noooo');
    });
    it('can use actual with symbols', () => {
        const m = mock('catMock', new CatClass('Olinka'));
        when(m[CatsSecretPlan]).useActual();
        expect(instance(m)[CatsSecretPlan]).toBe('destroy the internet');
    });
});
