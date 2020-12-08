import { getMetadata, hasMetadata, METADATA_KEY, setMetadata, WithMetadata } from '../../src/metadata';

interface MetadataType {
    foo: string;
    bar: string;
}

describe('metadata', () => {

    it('stores metadata on objects', () => {
        const m = setMetadata({} as WithMetadata<'mydata', MetadataType>, 'mydata', { foo: 'bar' });
        expect(getMetadata(m, 'mydata').foo).toBe('bar');
    });

    it('throws when there is no data', () => {
        expect(() => getMetadata({} as WithMetadata<'mydata', MetadataType>, 'mydata'))
                .toThrow('No metadata found');
    });

    it('sets weird metadata keys', () => {
        const obj = {
            [METADATA_KEY]: null
        };
        const m = setMetadata(obj as WithMetadata<'mydata', MetadataType>, 'mydata', { foo: 'bar' });
        expect(getMetadata(m, 'mydata').foo).toBe('bar');
    });

    it('setMetadata overwrites previous data', () => {
        const m = setMetadata({} as WithMetadata<'mydata', MetadataType>, 'mydata', {
            foo: 'bar',
            bar: 'baz'
        });
        setMetadata(m, 'mydata', {
            foo: 'biz'
        });
        expect(getMetadata(m, 'mydata').foo).toBe('biz');
        expect(getMetadata(m, 'mydata').bar).toBeUndefined();
    });

    it('hasMetadata tells you if there\'s metadata', () => {
        const obj: any = {};
        expect(hasMetadata(obj, 'mydata')).toBe(false);
        obj[METADATA_KEY] = undefined;
        expect(hasMetadata(obj, 'mydata')).toBe(false);
        obj[METADATA_KEY] = {
            mydata: true
        };
        expect(hasMetadata(obj, 'mydata')).toBe(true);
    });
});
