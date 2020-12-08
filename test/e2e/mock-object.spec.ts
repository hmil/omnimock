import { instance, mock, when } from '../../src';
import { setCustomFail } from '../../src/behavior/reporters';
import { METADATA_KEY } from '../../src/metadata';
import { CatClass } from '../fixtures/classes';

describe('the mock object', () => {

    it('has a metadata property', () => {
        const m = mock('foo');
        expect(METADATA_KEY in m).toBe(true);
    });

    it('does not have suspicious properties', () => {
        const m = mock('foo');
        expect('name' in m).toBe(false);
        expect('constructor' in m).toBe(false);
        expect('caller' in m).toBe(false);
    });

    it('does not accept custom properties', () => {
        const m = mock('foo');
        expect(() => Object.defineProperty(m, 'foo', {
            value: true
        })).toThrow(/Did you forget/);
    });

    it('makes no sense to mock the base object', () => {
        setCustomFail(null);
        const m = mock<CatClass>('m');
        when(m).useValue(new CatClass('Olinka'));
        expect(() => instance(m).name).toThrow(/Unexpected property access/);
    });
});
