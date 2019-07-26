import { mock, instance } from "../src";
import { CatClass, Container } from "./fixtures/classes";

describe('Instance backed mocks', () => {

    it('preserves instanceof property', () => {
        const catMock = mock(new CatClass('Olinka'));
        const containerMock = mock(new Container());

        expect(instance(catMock)).toBeInstanceOf(CatClass);
        expect(instance(catMock)).toBeInstanceOf(Container);
        expect(instance(containerMock)).toBeInstanceOf(Container);
        expect(instance(containerMock)).not.toBeInstanceOf(CatClass);
    });

    it('can be enumerated in a loop', () => {
        const original = new CatClass('Olinka');
        const catMock = mock(new CatClass('Olinka'));

        const seenProperties = [];
        const expectedProperties = [];
        for (const prop in instance(catMock)) {
            seenProperties.push(prop);
        }
        for (const prop in original) {
            expectedProperties.push(prop);
        }

        expect(seenProperties).toEqual(expectedProperties);
    });

    it('can inspect the prototype', () => {
        const original = new CatClass('Olinka');
        const catMock = mock(original);

        const seenProperties = [];
        const expectedProperties = [];
        for (const prop in instance(catMock).constructor.prototype) {
            seenProperties.push(prop);
        }
        for (const prop in CatClass.prototype) {
            expectedProperties.push(prop);
        }

        expect(seenProperties).toEqual(expectedProperties);
    });
});