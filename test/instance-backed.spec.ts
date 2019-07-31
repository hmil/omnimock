import { instance, mock } from '../src';
import { CatClass, Container } from './fixtures/classes';

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
        for (const prop of Object.getOwnPropertyNames(instance(catMock))) {
            seenProperties.push(prop);
        }
        for (const prop of Object.getOwnPropertyNames(original)) {
            expectedProperties.push(prop);
        }

        expect(seenProperties).toEqual(expectedProperties);
    });

    it('can inspect the prototype', () => {
        const original = new CatClass('Olinka');
        const catMock = mock(original);

        const seenProperties = [];
        const expectedProperties = [];
        for (const prop of Object.getOwnPropertyNames(instance(catMock).constructor.prototype)) {
            seenProperties.push(prop);
        }
        for (const prop of Object.getOwnPropertyNames(CatClass.prototype)) {
            expectedProperties.push(prop);
        }

        expect(seenProperties).toEqual(expectedProperties);
    });
});
