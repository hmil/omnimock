# List of built-in matchers

This is the comprehensive list of all argument matchers available in OmniMock. If you can't find what you are looking for, you can [create your own matcher](#custom-matcher).

## same

Matches variables by strict equality (===)

```ts
const cat = {
    fur: 'fluffy'
};
match(same(cat), { fur: 'fluffy' });   // no match
match(same(cat), cat);                 // match
const primitive = 2;
match(same(primitive), 2);             // match
```

## weakEquals

Matches variables by weak equality (==)

```ts
match(weakEquals(0), ''); // match
```

## anything

Matches any argument, but not omitted arguments.

```ts
const mockAnything  = mock<(n?: number): string>();

when(mockAnything(anything())).return('OK');

instance(mockAnything)(123); // 'OK'
instance(mockAnything)();    // Error
```

## instanceOf

Matches an object which is an `instanceof` the expected type.

## anyNumber, anyBoolean, anyString, anyFunction, anyObject, anySymbol, anyArray

Matches any variable of the given type.

```ts
const mockFn = mock<(n?: number | string): string>();

when(mockFn(anyNumber())).return('OK');

instance(mockFn)(123);      // 'OK'
instance(mockFn)('hello');  // 'OK'
instance(mockFn)();         // Error
```

## anyOf

Matches variables which match any of the provided arguments.  
This is effectively a logical "OR" operation for matchers.

```ts
const mockFn = mock<(n?: number | string): string>();

when(mockFn(anyOf(12, 'hello'))).return('OK');

instance(mockFn)(12);      // 'OK'
instance(mockFn)('hello'); // 'OK'
instance(mockFn)(42);      // Error
```

## allOf

Matches variables which match all of the provided arguments.  
This is effectively a logical "AND" operation for matchers.

```ts

class Cat {
    constructor(public readonly name: string) { }
}

const mockFn = mock<(n?: Cat): string>();

when(mockFn(allOf(
    instanceof(Cat),
    {
        name: 'Olinka'
    })))
    .return('OK');

instance(mockFn)(new Cat('Olinka'));  // 'OK'
instance(mockFn)({ name: 'Olinka' }); // Error
instance(mockFn)(new Cat('Oggies'));  // Error
```

## greaterThan

Matches any variable strictly greater than the provided reference.

## smallerThan

Matches any variable strictly smaller than the provided reference.

## greaterThanOrEqual

Matches any variable greater than or equal to the provided reference.

## smallerThanOrEqual

Matches any variable smaller than or equal to the provided reference.

## equals

Matches any variable strictly equal to the provided reference.

## between

Matches any variable between min and max.

Both min and max are inclusive in the range by default, but can be made exclusive by passing `exclusive: true` as shown below.

```ts
match(between(0, 10), 0)  // OK
match(between(0, 10), 10) // OK
match(between({ value: 0, exclusive: true }, 10), 0)  // Error
match(between(0, { value: 10, exclusive: true }), 10) // Error
``` 

## jsonEq

Matches an object whose JSON representation is the same as that of the expected.

## arrayEq

Matches an array which has the same number of elements as the expected array and whose elements match those in the
expected array.  
The expected array can contain nested matchers.

## objectEq

Matches an object by performing a recursive match against each member.
The set of members of the expected object must be the same as those of the actual object.


```ts
const myMock = mock<(arg: object) => string>();
const test = instance(myMock);

when(myMock(objectEq({
    name: 'Ola',
    age: between(30, 40)
}))).return('OK');

test({ name: 'Ola', age: 20 }));                 // Error
test({ name: 'Ola' }));                          // Error
test({ name: 'Ola', age: 35, job: 'teacher' })); // Error
test({ name: 'Ola', job: 'teacher' }));          // Error
test({ name: 'Ola', age: 35 }));                 // OK
```

### contains

Matches an object which contains members matching those of the reference.

```ts
const myMock = mock<(arg: object) => string>();
const test = instance(myMock);

when(myMock(contains({
    name: 'Ola',
    age: between(30, 40)
}))).return('OK');

test({ name: 'Ola', age: 20 }));                 // Error
test({ name: 'Ola' }));                          // Error
test({ name: 'Ola', age: 35, job: 'teacher' })); // OK
test({ name: 'Ola', job: 'teacher' }));          // Error
test({ name: 'Ola', age: 35 }));                 // OK
```


# <a name="custom-matcher"></a> Custom matcher

Use the function `matching` to create a custom matcher when you cannot find a built-in matcher that suits your needs.  
Return `true` from the callback if the provided value matches, or a string describing why it did not match.

```ts
const theAnswer = matching(
    (actual: number) => actual === 42 || 'This is not the answer',
    'answer to life');

match(theAnswer, 22) // 'This is not the answer'
match(theAnswer, 42) // true
```

Wrap it in a factory function if your matcher takes parameters.

```ts
function withScore(expected: number) {
    return matching(
        (actual: {score: number}) => actual.score === expected || 
            `Expected score to be ${expected} but was ${actual.score}`,
        'with score');
}

match(withScore(12), { score: 10 })    // 'Expected score to be 12 but was 10'
match(withScore(12), { score: 12 })    // true
```

If you think your matcher could be useful to other people too, please consider opening a PR to add it to the built-in matchers.
