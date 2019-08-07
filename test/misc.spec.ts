import { instance, mock, mockInstance, when } from '../src';
import { CatClass } from './fixtures/classes';

describe('mockInstance', () => {

    it('is a shorthand for instance(mock())', () => {
        const catMock = mock<CatClass>();

        when(catMock.tag).useValue(mockInstance('tag-mock'));

        expect(instance(catMock).tag).not.toBeUndefined();
        expect(() => instance(catMock).tag.chip).toThrow(/Unexpected.+chip/);
    });

    it('allows configuring mocks in a callback', () => {
        const catMock = mock<CatClass>();

        when(catMock.tag).useValue(mockInstance('tag-mock', tagMock => {
            when(tagMock.chip.id).useValue(321);
        }));

        expect(instance(catMock).tag.chip.id).toBe(321);
    });
    
    it('allows configuring backed mocks', () => {
        const catMock = mock<CatClass>();
        
        when(catMock.tag).useValue(mockInstance(new CatClass('Olinka').tag, tagMock => {
            when(tagMock.chip.id).useActual();
        }));
        expect(instance(catMock).tag.chip.id).toBe(123);
    });
});

describe('JSON stringification', () => {
    it('does not cause unexpected access on virtual mocks', () => {
        const catMock = mock<CatClass>();
        expect(() => JSON.stringify(instance(catMock))).not.toThrow();
    });
    it('does not cause unexpected access on backed mocks', () => {
        const catMock = mock(new CatClass('Olinka'));
        expect(() => JSON.stringify(instance(catMock))).not.toThrow();
    });
    it('does not cause unexpected access on partial mocks', () => {
        const catMock = mock<CatClass>({
            color: 'blue'
        });
        expect(() => JSON.stringify(instance(catMock))).not.toThrow();
    });
    it('can override expectations on toJSON', () => {
        const catMock = mock<CatClass>();
        when((catMock as any).toJSON).return(undefined).never();
        expect(() => JSON.stringify(instance(catMock))).toThrow();
    });
});

describe('the mock instance', () => {
    it('is always the same instance', () => {
        const catMock = mock<CatClass>({
            color: 'blue'
        });
        // tslint:disable-next-line: no-identical-expressions
        expect(instance(catMock) === instance(catMock)).toBe(true);
        expect(instance(catMock)).toBe(instance(catMock));
    });
});
