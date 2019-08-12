import { instance, mock, reset, when } from '../../src';
import { CatClass } from '../fixtures/classes';

describe('reset()', () => {

    it('resets an entire mock', () => {
        const catMock = mock(CatClass);
        const cat = instance(catMock);
    
        when(catMock.food).useValue('chips');
        when(catMock.name).useValue('Oggies');
        when(catMock.purr()).return('rrr');

        expect(cat.food).toBe('chips');
        expect(cat.name).toBe('Oggies');
        expect(cat.purr()).toBe('rrr');

        reset(catMock);

        expect(() => cat.food).toThrow(/Unexpected/);
        expect(() => cat.name).toThrow(/Unexpected/);
        expect(() => cat.purr()).toThrow(/Unexpected/);
    });

    it('resets a specific member expectation', () => {
        const catMock = mock(CatClass);
        const cat = instance(catMock);
    
        when(catMock.food).useValue('chips');
        when(catMock.name).useValue('Oggies');
        when(catMock.purr()).return('rrr');

        expect(cat.food).toBe('chips');
        expect(cat.name).toBe('Oggies');
        expect(cat.purr()).toBe('rrr');

        reset(catMock.food);

        expect(() => cat.food).toThrow(/Unexpected/);
        expect(cat.name).toBe('Oggies');
        expect(cat.purr()).toBe('rrr');
    });

    it('resets a specific method call but keeps the chain', () => {
        const catMock = mock(CatClass);
        const cat = instance(catMock);
    
        when(catMock.food).useValue('chips');
        when(catMock.name).useValue('Oggies');
        when(catMock.purr()).return('rrr');

        expect(cat.food).toBe('chips');
        expect(cat.name).toBe('Oggies');
        expect(cat.purr()).toBe('rrr');

        reset(catMock.purr());

        expect(cat.food).toBe('chips');
        expect(cat.name).toBe('Oggies');
        expect(cat.purr).not.toBeUndefined();
        expect(() => cat.purr()).toThrow(/Unexpected/);
    });

    it('trims a chain', () => {
        const catMock = mock(CatClass);
        const cat = instance(catMock);
    
        when(catMock.food).useValue('chips');
        when(catMock.name).useValue('Oggies');
        when(catMock.purr()).return('rrr');

        expect(cat.food).toBe('chips');
        expect(cat.name).toBe('Oggies');
        expect(cat.purr()).toBe('rrr');

        reset(catMock.purr);

        expect(cat.food).toBe('chips');
        expect(cat.name).toBe('Oggies');
        expect(() => cat.purr).toThrow(/Unexpected/);
        expect(() => cat.purr()).toThrow(/Unexpected/);
    });

    it('reset expectations cant come back from the dead', () => {
        const catMock = mock(CatClass);
        const cat = instance(catMock);
    
        when(catMock.food).useValue('chips');
        when(catMock.name).useValue('Oggies');
        when(catMock.purr()).return('rrr');
        
        expect(cat.food).toBe('chips');
        expect(cat.name).toBe('Oggies');
        expect(cat.purr()).toBe('rrr');
        
        reset(catMock.purr);

        when(catMock.purr()).return('dead');
        
        expect(cat.food).toBe('chips');
        expect(cat.name).toBe('Oggies');
        expect(cat.purr()).toBe('dead');
    });
});
