import { CatClass } from "./fixtures/classes";
import { mock, when, mockInstance, instance } from "../src";

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