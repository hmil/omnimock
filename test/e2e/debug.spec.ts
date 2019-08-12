import { debug, mock, mockInstance, when } from '../../src';
import { CatClass } from '../fixtures/classes';

describe('the debug utility', () => {

    it('prints debug info at the root', () => {
        const m = mock(CatClass);
        when(m.name).useValue('green');
        when(m.getTag(12)).return(mockInstance('tag'));
        when(m.getTag(1).manufacturer.fetch()).resolve('a');
        when(m.getTag(1).chip.id).useValue(42);

        expect(debug(m)).toEqual(`<CatClass>.name : expected any times, received 0
<CatClass>.getTag : expected any times, received 0
<CatClass>.getTag(12) : expected any times, received 0
<CatClass>.getTag(1) : expected any times, received 0
<CatClass>.getTag(1).manufacturer : expected any times, received 0
<CatClass>.getTag(1).chip : expected any times, received 0
<CatClass>.getTag(1).manufacturer.fetch : expected any times, received 0
<CatClass>.getTag(1).manufacturer.fetch() : expected any times, received 0
<CatClass>.getTag(1).chip.id : expected any times, received 0`);
    });
});
