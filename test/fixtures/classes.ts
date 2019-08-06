
export class Container {

    receive(t: unknown): string {
        return `hello ${t}`;
    }
}

export interface Tag {
    chip: {
        id: number
    };
    manufacturer: {
        fetch(): Promise<string>;
    };
    siblings: Tag[];
}

export class CatClass extends Container {

    public tag: Tag = {
        chip: {
            id: 123
        },
        manufacturer: {
            fetch: () => Promise.resolve('nokia')
        },
        siblings: []
    };

    public getTag(_tagNumber: number): Tag {
        return this.tag;
    }
    
    constructor(
            public name: string) {
        super();
    }

    public static isCat(t: Container): t is CatClass {
        return t instanceof CatClass;
    }

    public get food(): string {
        return 'oreos';
    }

    public color = 'gray';

    public purr(): string {
        return `Rrrr ${this.name}`;
    }

    public greet(other: string): string {
        return `Hello ${other}`;
    }

    // Placing a cat in a cat will tear through the fabric of the universe, othewrise you're fine
    public placeIn<T extends CatClass>(container: T): never;
    public placeIn<T extends Container>(container: T): string;
    public placeIn<T extends Container>(container: T): never | string {
        if (CatClass.isCat(container)) {
            throw new Error(`The universe just ended`);
        }
        return container.receive(this);
    }
}