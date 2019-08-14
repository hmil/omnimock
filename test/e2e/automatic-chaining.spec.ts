import { greaterThan, instance, mock, verify, when } from '../../src';
import { CatClass } from '../fixtures/classes';

describe('manual chaining', () => {
    it('is very verbose', () => {
        const catMock = mock(CatClass);
        const tagMock = mock<CatClass['tag']>('tag');
        const tag = instance(tagMock);
        const chipMock = mock<typeof tag['chip']>('chip');
        const chip = instance(chipMock);

        when(catMock.tag).useValue(tag);
        when(tagMock.chip).useValue(chip);
        when(chipMock.id).useValue(123);

        expect(instance(catMock).tag.chip.id).toBe(123);
    });
});

describe('automatic chaining', () => {

    it('works with getters and fake', () => {
        const catMock = mock(CatClass);
        when(catMock.tag.chip.id).useValue(456);
        expect(instance(catMock).tag.chip.id).toBe(456);
    });

    it('works with getters and pass-through', () => {
        const catMock = mock('catMock', new CatClass('tommy'));
        when(catMock.tag.chip.id).useActual();
        expect(instance(catMock).tag.chip.id).toBe(123);
    });

    it('works with methods and fake', async () => {
        const catMock = mock(CatClass);
        when(catMock.getTag(1).manufacturer.fetch()).call(async () => 'I <3 chaining');
        expect(await instance(catMock).getTag(1).manufacturer.fetch()).toBe('I <3 chaining');
    });

    it('works with methods and pass-through', async () => {
        const catMock = mock('catMock', new CatClass('tommy'));
        when(catMock.getTag(1).manufacturer.fetch()).callThrough();
        expect(await instance(catMock).getTag(1).manufacturer.fetch()).toBe('nokia');
    });

    it('works with arrays', () => {
        const catMock = mock(CatClass);
        when(catMock.tag.siblings[2].chip.id).useValue(12);
        when(catMock.tag.siblings[0].chip.id).useValue(432);
        expect(instance(catMock).tag.siblings[2].chip.id).toBe(12);
        expect(instance(catMock).tag.siblings[0].chip.id).toBe(432);
    });

    it('catches unexpected accesses', () => {
        const catMock = mock(CatClass);

        // Actually assert the chip path
        when(catMock.tag.chip.id).useValue(123);
        // And use the manufacturer path but without any assertion
        // tslint:disable-next-line: no-unused-expression
        catMock.tag.manufacturer.fetch;

        expect(() => instance(catMock).tag.manufacturer.fetch).toThrow(/Unexpected.+manufacturer/);
    });

    it('follows the rules of cascading matchers', async () => {
        const catMock = mock(CatClass);
        const realCat = new CatClass('Olinka');

        // Automatic chaining will create an expectation for getTag(> 10)
        when(catMock.getTag(greaterThan(10)).chip.id).useValue(12);
        // This creates another expectation for getTag( > 6) which competes with the first
        when(catMock.getTag(greaterThan(6))).useValue(realCat.tag);
        // This again competes with the two previous expectations
        when(catMock.getTag(greaterThan(3)).chip.id).useValue(3);
        // This will re-use the first expectation (10) and will therefore have priority over '6'
        when(catMock.getTag(greaterThan(10)).manufacturer.fetch()).resolve('hitachi');

        expect(instance(catMock).getTag(11).chip.id).toBe(12);

        expect(await instance(catMock).getTag(11).manufacturer.fetch()).toBe('hitachi');
        expect(instance(catMock).getTag(7)).toBe(realCat.tag);
        expect(instance(catMock).getTag(4).chip.id).toBe(3);
    });

    it('allows any number of accesses', () => {
        const catMock = mock(CatClass);

        when(catMock.purr()).return('hoyhoy').anyTimes();
        when(catMock.getTag(1).manufacturer.fetch()).resolve('hoyhoy').once();

        const cat = instance(catMock);

        expect(() => cat.getTag).not.toThrow();
        expect(() => cat.getTag(1)).not.toThrow();
        expect(() => cat.getTag(1).manufacturer).not.toThrow();
        expect(() => cat.getTag(1).manufacturer.fetch).not.toThrow();
        expect(() => cat.getTag(1).manufacturer.fetch()).not.toThrow();
        expect(() => verify(catMock)).not.toThrow();
    });
});
