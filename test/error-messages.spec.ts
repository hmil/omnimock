import { instance, mock } from '../src';
import { CatClass } from './fixtures/classes';

describe('error messages', () => {

    it('has a default for virtual mocks', () => {
        const catMock = mock<CatClass>();

        expect(() => instance(catMock).purr()).toThrow(/<virtual mock>.purr/);
    });

    it('uses the custom name', () => {
        const catMock = mock<CatClass>('virtual cat');

        expect(() => instance(catMock).purr()).toThrow(/<virtual cat>.purr/);
    });
});
