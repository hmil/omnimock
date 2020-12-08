import { mockInstance } from '../../src';

describe('Compatibility hacks', () => {

    it('prevent tripping early on well-known properties', () => {
        const myMock = mockInstance<any>('mock');
        expect(() => myMock.asymmetricMatch).not.toThrow();
        expect(() => myMock.then).not.toThrow();
    });
});
