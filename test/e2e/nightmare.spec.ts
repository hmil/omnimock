import { anyString, between, greaterThan, instance, mock, when } from '../../src';
import { setCustomFail } from '../../src/behavior/reporters';

describe('The nightmare test suite', () => {

    it('is a hodgepodge of contrived usages', () => {
        setCustomFail(null);

        /**
         * This interface is a nightmare to mock... or is it?
         */
        interface Nightmare {
            // Can be called
            (subject: string, count: number): { status: 'ok' | 'fail'};
            // Has static properties
            attributes: {
                scariness: number;
                color: string;
            };
            // Deeply nested object with mixed-in methods and properties
            plane: DreamLevel;
            // Has methods
            sendMessage(id: number, message: string): { response: string };
            // This name must be escaped
            '!improbable'(): string;
        }

        interface DreamLevel {
            characters: string[];
            isLimbo: boolean;
            dreamOf(character: string): DreamLevel;
        }

        // This is our mock control, we use it to set expectations...
        const nightmareMock = mock<Nightmare>('nightmareMock');
        // ...which will be realized by this mocked instance
        const nightmare = instance(nightmareMock);

        // Mock the function call
        when(nightmareMock('ghosts', greaterThan(3))).return({ status: 'ok' });
        expect(nightmare('ghosts', 4)).toEqual({ status: 'ok' });
        
        // Mock attributes
        const nightmareAttributes = { 
            color: 'blue',
            scariness: 2
        };
        when(nightmareMock.attributes).useValue(nightmareAttributes);
        expect(nightmare.attributes).toBe(nightmareAttributes);

        // Mock a method
        when(nightmareMock.sendMessage(between(10, 19), 'Oh hey mark!')).return({ response: 'cut' });
        expect(nightmare.sendMessage(12, 'Oh hey mark!')).toEqual({ response: 'cut' });

        // Mock member with strange name
        when(nightmareMock['!improbable']()).return('world');

        // Mock something deeply nested and convoluted
        const yusufsDreamMock = nightmareMock.plane.dreamOf('yusuf').dreamOf;
        when(yusufsDreamMock('cobb').isLimbo).useValue(true);
        when(yusufsDreamMock('arthur').dreamOf('eames').isLimbo).useValue(false);
        when(yusufsDreamMock('arthur').dreamOf('eames').dreamOf('saito').isLimbo).useValue(true);
        // MockDream is a recursive "catch all" which will accept to visit any dream
        const mockDream = mock<DreamLevel>('mockDream');
        when(mockDream.characters).useValue([ 'ghost' ]);
        when(mockDream.isLimbo).useValue(true);
        when(mockDream.dreamOf(anyString())).return(instance(mockDream));
        // We hook it up at the end such that any of the dreams which weren't mocked above are caught by the mockDream.
        when(nightmareMock.plane.dreamOf(anyString())).return(instance(mockDream));

        const yusufsDream = nightmare.plane.dreamOf('yusuf');
        expect(yusufsDream.dreamOf('cobb').isLimbo).toBe(true);
        expect(yusufsDream.dreamOf('arthur').dreamOf('eames').isLimbo).toBe(false);
        expect(yusufsDream.dreamOf('arthur').dreamOf('eames').isLimbo).toBe(false);
        expect(yusufsDream.dreamOf('arthur').dreamOf('eames').dreamOf('saito').isLimbo).toBe(true);
        expect(() => yusufsDream.dreamOf('cobb').characters).toThrow(); // Unexpected access to member "characters"
        expect(nightmare.plane.dreamOf('the pilot').dreamOf('something else').characters).toEqual(['ghost']);
    });
});
