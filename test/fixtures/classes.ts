
export class Container {

    receive(t: unknown): string {
        return `hello ${t}`;
    }
}

export class CatClass extends Container {
    
    constructor(
            public readonly name: string) {
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