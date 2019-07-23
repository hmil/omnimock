import { CatClass, Container, Tag } from './fixtures/classes';
import { instance, mock, when } from '../src';
import { InstanceBackedMock } from '../src/mocks';

describe('A mock based on a class', () => {

    it('can instantiate with or without constructor params', () => {
        const catMock = mock(CatClass, 'Olinka');
        const containerMock = mock(Container);

        expect(instance(catMock)).toBeInstanceOf(CatClass);
        expect(instance(containerMock)).toBeInstanceOf(Container);
        expect(instance(containerMock)).not.toBeInstanceOf(CatClass);
    });

    it('can create a virtual mock', () => {
        const catMock = mock<CatClass>();
        expect(instance(catMock)).not.toBeInstanceOf(CatClass);
    });

    describe('property access', () => {
        it('can mock property access', () => {
            const catMock = mock(CatClass, 'Olinka');
            const cat = instance(catMock);

            const mockPurr = jest.fn(() => 'miaou');
     
            when(catMock.food).useValue('chips');
            when(catMock.name).useValue('Oggies');
            when(catMock.purr).useValue(mockPurr);
    
            expect(cat.food).toBe('chips');
            expect(cat.name).toBe('Oggies');
            expect(cat.purr()).toBe('miaou');
    
            expect(mockPurr.mock.calls.length).toBe(1);
        });

        it('can mock property access in getter style', () => {
            const catMock = mock(CatClass, 'Olinka');
            const cat = instance(catMock);
    
            const mockPurr = jest.fn(() => 'miaou');
     
            when(catMock.name).useGetter(() =>'Oggies');
            when(catMock.food).useGetter(() => 'chips');
            when(catMock.purr).useGetter(() => mockPurr);
    
            expect(cat.food).toBe('chips');
            expect(cat.name).toBe('Oggies');
            expect(cat.purr()).toBe('miaou');
    
            expect(mockPurr.mock.calls.length).toBe(1);
        });
    
        it('forwards errors in getters', () => {
            const catMock = mock(CatClass, 'Olinka');
            const cat = instance(catMock);
     
            when(catMock.food).useGetter(() => { throw new Error('not hungry') });
    
            expect(() => cat.food).toThrow('not hungry');
        });
    
        it('prevents unmocked property access', () => {
            const catMock = mock(CatClass, 'Olinka');
            const cat = instance(catMock);
    
            expect(() => cat.name).toThrow(/Unexpected/);
            expect(() => cat.food).toThrow(/Unexpected/);
            expect(() => cat.purr).toThrow(/Unexpected/);
        });

        it('can access base property of instance backed mocks', () => {
            const concreteMock = mock(CatClass, 'Olinka');
            const virtualMock = mock<CatClass>();

            when(concreteMock.color).useActual();
            when(concreteMock.name).useActual();
            when(concreteMock.food).useActual();
            when(virtualMock.name).useActual.__TSMOCK_ERROR__;

            const concrete = instance(concreteMock);

            expect(concrete.color).toBe('gray');
            expect(concrete.name).toBe('Olinka');
            expect(concrete.food).toBe('oreos');
        });
    });
    

    describe('method calls', () => {
        it('can mock function calls', () => {
            const catMock = mock(CatClass, 'Olinka');
            const cat = instance(catMock);
    
            when(catMock.placeIn({} as any)).return('placed');
            when(catMock.purr()).throw(new Error('mock error'));
            when(catMock.receive({})).call((data) => `This is ${data}`);

            expect(cat.placeIn({} as any)).toBe('placed');
            expect(() => cat.purr()).toThrow('mock error');
            expect(cat.receive('sparta')).toBe('This is sparta');
        });


        it('can call through instance backed mocks', () => {
            const concreteMock = mock(CatClass, 'Olinka');
            const virtualMock = mock<CatClass>();

            when(concreteMock.purr()).callThrough();
            when(concreteMock.greet('anyone')).callThrough();
            when(virtualMock.purr()).callThrough.__TSMOCK_ERROR__;
            // What happens if someone forces through the type system?
            when((virtualMock as any as InstanceBackedMock<CatClass>).purr()).callThrough();
            when(concreteMock.name).useActual();

            const concrete = instance(concreteMock);

            expect(concrete.greet('jack')).toBe('Hello jack');
            expect(concrete.purr()).toBe('Rrrr Olinka');
            concreteMock.color
            expect(() => instance(virtualMock).purr()).toThrow();
        });
    });

    describe('automatic chaining', () => {
        it('can be achieved "manually"', () => {
            const catMock = mock<CatClass>();
            const tagMock = mock<CatClass['tag']>();
            const tag = instance(tagMock);
            const chipMock = mock<typeof tag['chip']>();
            const chip = instance(chipMock);

            when(catMock.tag).useValue(tag);
            when(tagMock.chip).useValue(chip);
            when(chipMock.id).useValue(123);

            expect(instance(catMock).tag.chip.id).toBe(123);
        });

        it('works with getters and fake', () => {
            const catMock = mock(CatClass, 'tommy');
            when(catMock.tag.chip.id).useValue(456);
            expect(instance(catMock).tag.chip.id).toBe(456);
        });

        it('works with getters and pass-through', () => {
            const catMock = mock(CatClass, 'tommy');
            when(catMock.tag.chip.id).useActual();
            expect(instance(catMock).tag.chip.id).toBe(123);
        });

        it('works with methods and fake', async () => {
            const catMock = mock(CatClass, 'tommy');
            when(catMock.getTag().manufacturer.fetch()).call(async () => 'I <3 chaining');
            expect(await instance(catMock).getTag().manufacturer.fetch()).toBe('I <3 chaining');
        });

        it('works with methods and pass-through', async () => {
            const catMock = mock(CatClass, 'tommy');
            when(catMock.getTag().manufacturer.fetch()).callThrough();
            expect(await instance(catMock).getTag().manufacturer.fetch()).toBe('nokia');
        });
    
        it('catches unexpected accesses', () => {
            const catMock = mock(CatClass, 'tommy');

            // Actually assert the chip path
            when(catMock.tag.chip.id).useValue(123);
            // And use the manufacturer path but without any assertion
            catMock.tag.manufacturer.fetch;

            expect(() => instance(catMock).tag.manufacturer.fetch).toThrow(/Unexpected.+manufacturer/);
        });
    })
});
