export class Range {

    private readonly minimum: number;

    private readonly maximum: number;

    constructor(count: number);
    constructor(minimum: number, maximum: number);
    constructor(minimumOrCount: number, maximum?: number) {
        this.minimum = minimumOrCount;
        this.maximum = maximum != null ? maximum : minimumOrCount;

        if (this.maximum < this.minimum) {
            throw new Error('minimum must be <= maximum');
        }
        if (this.minimum < 0) {
            throw new Error('minimum must be >= 0');
        }
        if (this.maximum < 0) {
            throw new Error('maximum must be >= 0');
        }
    }

    public hasFixedCount(): boolean {
        return this.minimum === this.maximum;
    }

    public getMaximum(): number {
        return this.maximum;
    }

    public getMinimum(): number {
        return this.minimum;
    }

    public toString(): string {
        if (this.hasFixedCount()) {
            if (this.minimum === 1) {
                return 'once';
            }
            if (this.minimum === 0) {
                return 'never';
            }
            return `${this.minimum} times`;
        } else if (this.hasOpenCount()) {
            if (this.minimum === 0) {
                return `any times`;
            }
            return `at least ${this.minimum}`;
        } else {
            return `between ${this.minimum} and ${this.maximum}`;
        }
    }

    public contains(count: number): boolean {
        return this.minimum <= count && count <= this.maximum;
    }

    public hasOpenCount(): boolean {
        return this.maximum === Number.MAX_SAFE_INTEGER;
    }
}


/**
 * Exactly one call.
 */
export const ONCE = new Range(1);

/**
 * One or more calls.
 */
export const AT_LEAST_ONCE = new Range(1, Number.MAX_SAFE_INTEGER);

/**
 * Zero or one call
 */
export const AT_MOST_ONCE = new Range(0, 1);

/**
 * Zero or more calls.
 */
export const ZERO_OR_MORE = new Range(0, Number.MAX_SAFE_INTEGER);

/**
 * Zero or more calls.
 */
export const NEVER = new Range(0, 0);
