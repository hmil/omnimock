# OmniMock - Mocks for TypeScript [![Build Status](https://travis-ci.org/hmil/omnimock.svg?branch=master)](https://travis-ci.org/hmil/omnimock) [![npm version](https://badge.fury.io/js/omnimock.svg)](https://badge.fury.io/js/omnimock)

OmniMock is a test mock library for TypeScript, with a focus on strong typing and ease of use.

Unlike other similar libraries, OmniMock was built from the ground up for TypeScript and makes no compromise.

# Requirements

OmniMock aims to bring the best possible mocking experience in TypeScript with no compromise. This comes at the cost of a few prerequisites:

- TypeScript 3.1 or above
- A runtime which supports [the Proxy API](http://kangax.github.io/compat-table/es6/#test-Proxy) (it can not be polyfilled, but any recent version of Node.js or mainstream browser will do)

# Philosophy

A mock library attempts to fulfill multiple contradictory goals. Each author choses to solve the conflicts in a different way and this is why there are many mocking libraries out there.
OmniMock uses a principled approach to solve these goals in a rational way. We believe that by basing all design decisions on this list, we create something that is not just nice to look at on github, but also increases productivity when used in the real world.

1. **Strong typing** is just as necessary in test code as it is in production code. By using `any` all over the place, or by creating ad-hock objects as mocks, you lose the connection between your production code and your test code. Features like symbol renaming and usage lookup don't apply to your tests which makes it harder to understand and refactor your codebase. What's more, loose types mean your tests might get out of sync without you even noticing, and at some point they basically become dead weight.
2. **Sound design**. When something works, it always works. Some APIs such as that of [substitute](https://github.com/ffMathy/FluffySpoon.JavaScript.Testing.Faking) generate namespace and type conflicts. Then you have to use a workaround if you are unfortunate enough to use the same name as that of a method of the framework, and you need to turn off strict null checking. These exceptions are here because the author chose to favor fewer keystrokes over soundness. In OmniMock, the mock control and the mock object are two different objects with different types, which makes for a more robust API with no special cases. No need to disable strict type checking and no risk for your type to collide with that of OmniMock.
3. **Ease of use** comes only third in the list. JavaScript is a very flexible language which lets you design APIs however you like them. Some authors get carried away and bundle as much "nice to haves" as they can without thinking about soundness or type safety.
  That being said, one likes a nice API. That is why OmniMock offers powerful utilities such as automatic chaining for deeply nested properties, a single entry point to generate any kind of mock, wether it's a class instance, interface, function or object.
  Helpers like `.resolve` and `.reject` help you reduce the boilerplate without losing any type safety.

# Introduction

## Why use a mocking library?

Unit tests need to be isolated. In order to achieve this, many guides show basic examples of what we can call "manual mocking".

```ts
const fakeCard: MtgCard = {
    cost: 'UW',
    color: 'white',
    kind: 'sorcery',
    art: 'John Avon',
    play: () => ({}  as any),
    burry: () => ({}  as any),
    // ...
}

const gameState: MtgState = {
    player1: {
        getManaPool() {
            return [ { color: 'W', qty: 1 } ];
        },
        // ...
    },
    player2: {
        getManaPool() {
            return [ ]; // Not important
        },
        // ...
    },
    clock: {
        player: 1,
        phase: 'precombat main'
    }
}

const result = battlefield.castSpell(gameState, fakeCard);

expect(result.type).toBe('illegal move');
expect(result.reason).toBe('not enough mana');
```

The setup of the mocks is huge, it is hard to maintain, contains a lot of useless data, and juggles with types. IDE features like symbol lookup and renaming don't work in test code. The fake data may become inconsistent with the expected type and unit tests exercise situations which were already ruled out by the type system.  
Developpers are incentivised to rely on actual implementations of the dependencies rather than mocks. This can quickly pile up to a mountain of tech debt and deter anyone from attempting any kind of refactoring on the main codebase.

Enters a mocking library.

The main feature a mocking library brings to the table is **automatic mocks**. What these allow you to do is focus on what is relevant to your specific test case, and ignore all of the rest. All of this while increasing type safety across your entire test suite.

Going back to the example above, we know that the `battlefield` class will only need the card's mana cost, player 1's mana reserve and the clock data. We can rewrite the test like this.

```ts
const fakeCard = mock<MtgCard>({
    cost: 'UW'
});
const gameState = mock<MtgState>({
    clock: {
        player: 1,
        phase: 'precombat main'
    }
});
when(gameState.player1.getManaPool())
    .return([ { color: 'W', qty: 1 } ])
    .once();

const result = battlefield.castSpell(gameState, fakeCard);

expect(result.type).toBe('illegal move');
expect(result.reason).toBe('not enough mana');
```

You may argument that the above can easily be achieved by creating a manual mock of `Partial<MtgCard>` and `Partial<MtgState>`, and only populating the relevant field. Effectively, this would be very similar to what we just did above. However, there are two problems with this approach:

1. You will have to force a cast from `Partial<T>` to `T`. This is TypeScript telling you that you are doing something wrong...
2. ...The wrong thing being: your production code is not equipped to deal with undefined values from your `Partial`. If it turns out the code uses some of the properties you thought it did not use, then it is possible that the undefined value will trickle down your system and cause an Error far from the original place the culprit value came from.

**By contrast, if you forget to mock something, or if you make some changes to the code of `battlefield`, then OmniMock might throw an error like this: `Error: Unexpected call to MtgCard.play()`, with a stacktrace pointing to the exact location where the unexpected call occurred.**

## Quick peek

This is what a test using OmniMock could look like:

```ts
import { instance, mock, verify, when } from 'omnimock';

// Definitions
interface CatType {
    greet(name: string): string;
}
const myService = {
    doSomethingWithACat(cat: CatType) {
        return `cat says: ${cat.greet('John')}`;
    }
}

// Setup
const mockCat = mock<CatType>();
when(mockCat.greet('John')).return('Hello John');

// Test execution
const result = myService.doSomethingWithACat(instance(mockCat));

// Verification
verify(mockCat);
expect(result).toEqual('cat says: Hello John');
```

# Features

- [Creating a mock](#types-of-mock)
  - [Virtual mocks](#virtual-mock)
  - [Backed mocks](#backed-mock)
    - [Partial mocks](#partial-mock)
  - [Function mocks](#function-mock)
  - [Inline mocks](#inline-mock)
- [Matching](#matching)
  - [Method or function call](#expect-function-call)
  - [Member access](#expect-member-access)
  - [Match function arguments](#argument-matchers)
    - [List of matchers](#matchers-list)
  - [Deeply nested properties (_automatic chaining_)](#automatic-chaining)
- [Mocking the results](#result-mocking)
  - [Using a value](#use-value)
  - [Using a fake](#call-fake)
  - [Using the real object](#call-through)
  - [Throw an error](#throw-error)
  - [Promises](#throw-error)
- [Verification](#verification)
  - [Quantifiers](#quantifiers)
  - [Fail on unrealized expectation](#verify)
  - [Fail on unexpected call or access](#unexpected-call)
- [Misc](#misc)
  - [Debugging](#debugging)
  - [Resetting a mock](#resetting)
  - [Capturing values](#capture)



## <a name="types-of-mock"></a> Creating a mock

Use the `mock()` method to create a mock. Set expectations on the object returned by the `mock()` method, and pass the `instance` of that mock to your tested code.

```ts
// Use the mock to set expectations
const someServiceMock = mock(SomeService);
when(someServiceMock.doStuff()).return('hi').once();

// Pass the instance to the class you are testing
const someService = instance(myMock);
const testClass = new TestClass(someService);
```

`instance()` always returns a reference to the same object. The expectations you set on the mock always affect the instance, even after you've obtained a reference to it.

If you do not need to set expectations on the mock, you can use `mockInstance` as a shorthand for `instance(mock())`.

### <a name="virtual-mock"></a> Virtual mocks

You can mock any object type or interface without providing an actual instance of it. This is called a _virtual_ mock because it doesn't retain any type information at runtime.  
Virtual mocks have some limitations. [Learn more here](#backed-vs-virtual).

```ts
// Mock an interface by passing it as a type argument to the mock function.
// Give it a name to help print nice error messages
const mockAssemblyService = mock<AssemblyService>('mockAssemblyService');
// Mock a class from its constructor. The name and type are infered automatically.
const mockAssemblyService = mock(AssemblyService);
```

### <a name="backed-mock"></a> Backed mocks

Passing an actual object to the mock function creates a _backed_ mock. Backed mocks support features such as `.callThrough()` and `.useActual()`, and work with code which uses property enumeration. See [backed mock](#backed-vs-virtual).

```ts
const realAssemblyService = {
    assemble(parts: PartsList, blueprint: Blueprint) { /* ... */ }
    version: 2
};
// realAssemblyService "backs" assemblyServiceMock
const assemblyServiceMock = mock('assemblyServiceMock', realAssemblyService);
// This works well with classes too
const assemblyServiceMock = mock('assemblyServiceMock', new AssemblyService());
```

By default, property access on a backed mock don't trigger an error (ie. they behave like .[useActual](#call-through)().[anyTimes](#quantifiers)()).  
If you want to forbid some function call or property access, use a quantifier like this:

```ts
when(assemblyServiceMock.assemble).useActual().never();
```

#### <a name="partial-mock"></a> Partial mocks

You can omit properties when you create a backed mock.

```ts
const assemblyServiceMock = mock<AssemblyService>('assemblyServiceMock', {
    version: 2
});
```

If you have access to the class constructor, use this form instead. It supports `instanceof` and prototype-based operations.

```ts
const assemblyServiceMock = mock(AssemblyService, {
    version: 2
});
```

Note that this does not work with abstract classes and interfaces.

A mock created this way will accept any get or set operation on the specified members, but will throw an error if one attempts to get an omitted property.

```ts
assemblyService.version; // 2
assemblyService.assemble(parts, blueprint); // Error: unexpected property access: AssemblyService.assemble
```

This is useful to mock data types (ie. classes or types which contain raw data and almost no actual logic).

### <a name="function-mock"></a> Function mocks

You can also mock simple functions, both as a virtual or a backed mock.

```ts
// Named virtual mock
const luckyNumberMock = mock<(name: string) => number>('luckyNumber');
// Backed mock
const luckyNumberMock = mock('luckyNumber', (name: string) => {
    return name.charCodeAt(0);
});
```

### <a name="inline-mock"></a> Inline mocks

Inline mocks allow you to create a backed or virtual mock on the spot, with a more compact syntax. This can be helpful in some situations.

Take the following code.

```ts
const mockCard: MtgCard = {
    id: 1038,
    cost: 'UW',
    color: 'white',
    kind: 'sorcery',
    art: 'John Avon',
    // ...
};

when(codex.getCard('Starlight'))
        .return(mockCard);
```

Specifying all members of the card can be tedious, especially if the tested class does not actually use the card. You could write the following to make your test more succint without losing type safety and while keeping the guarantee of no undefined behavior.

```ts
const mockCard = instance(mock<MtgCard>('fake card', {
    // Omit the properties you don't need. 
    // Omnimock will throw an error if it turns out you need them.
    id: 1038,
    color: 'white'
}));
when(codex.getCard('Starlight')).return(mockCard);
```

In fact, this pattern is so common that we created a shortcut for it: `mockInstance`.

```ts
const mockCard = mockInstance<MtgCard>('fake card', {
    id: 1038,
    color: 'white'
});
when(codex.getCard('Starlight')).return(mockCard);
```

A common pattern is to provide a return value which you are not sure if it is used or not.

```ts
when(codex.getCard('Starlight')).return(mockInstance('fake card'));
// Or better, if you have access to a constructor this is more accurate:
when(codex.getCard('Starlight')).return(mockInstance(MtgCard));
```

Then, you keep adding the necessary attributes as you discover them. For instance, I can write the following if I get the error `Unexpected property access: <fake card>.id`.

```ts
when(codex.getCard('Starlight')).return(mockInstance('fake card', {
    id: 1038
}));
// Or:
when(codex.getCard('Starlight')).return(mockInstance(MtgCard, {
    id: 1038
}));
```

You can further customize the mock by using a callback. The callback receives the mock builder.

```ts
when(codex.getCard('Starlight'))
    .return(mockInstance('fake card', {}, fakeCard => {
        when(fakeCard.play(anything())).call(gameState => { 
            expect(gameState.turn).toBe(2);
        });
    }));
```

This pattern is useful to avoid confusing the mock builder and the mock instance, since the mock builder can't easily escape from the callback. However,, this syntax can quickly become too heavy, and you might prefer to use [deep chaining](#automatic-chaining).  
The example above is roughly equivalent to the following.

```ts
when(codex.getCard('Starlight').play(anything())).call(gameState => {
    expect(gameState.turn).toBe(2);
});
```


## <a name="matching"></a> Matching

Use `when()` to set expectations on a mock.

Expectations are evaluated in the order in which they are declared. The first matching expectation is used.

### <a name="expect-function-call"></a> Method or function call

```ts
when(myMock.doStuff()).return('hi');
```

Or, if you've mocked a [simple function](#function-mock):
```ts
when(myMock()).return('hi');
```

### <a name="expect-member-access"></a> Member access

```ts
when(myMock.version).useValue(2);
```

### <a name="argument-matchers"></a> Match function arguments

A collection of matchers is provided to help you narrow down your expectations:

```ts
when(myMock.someComputation(between(0, 4), same(superComputer), anyString())).return(2);
```

Arguments are matched by deep-comparison by default. Use `same()` to compare by reference instead.

#### <a name="matchers-list"></a> List of matchers

The full [list of matchers](https://github.com/hmil/omnimock/blob/master/MATCHERS.md) is available in the docs. Otherwise, you can [create your own matchers](https://github.com/hmil/omnimock/blob/master/MATCHERS.md#custom-matcher).

### <a name="automatic-chaining"></a> Deeply nested properties (aka. _automatic chaining_)

You can mock any arbitrarily deeply nested object.

```ts
when(myMock.members.getByName('Steve').job.getCompany().name).useValue('Pixar');
```

If your mock is [backed](#backed-vs-virtual), you can even forward property access and method calls:

```ts
when(myMock.members.getByName('Steve').job.getCompany().name).useActual();
```

Be careful when mocking deeply nested properties. The matcher resolution works its way from left to right and never backtracks. This means that you need to look at the chain segment by segment, the first expectation that matches a segment wins immediately, even before the rest of the chain is evaluated.

```ts
when(myMock.members.getByName('Steve').job.getCompany().name).useValue('Pixar');
when(myMock.members.getByName(anyString()).job.getCompany().address).useValue('1200 Park Ave');

// Throws an error because, the first expectation won at 'getByName' 
// and it does not expect an access to 'address'.
// If you removed the first line, then this would return '1200 Park Ave'
instance(myMock).members.getByName('Steve').job.getCompany().address 
```

If you use the same path more than once, then expectations are combined. This provides a more natural experience, but it also creates the following pitfall:

```ts
// These expectations are combined naturally
when(myMock.members.getByName('Steve').job.getCompany().name).useValue('Pixar');
when(myMock.members.getByName('Steve').job.getCompany().address).useValue('1200 Park Ave');
when(myMock.members.getByName('Steve').job.title).useValue('Engineer');
// This is added after to catch any member who is not Steve
when(myMock.members.getByName(anyString())).return(defaultMember);
// Pitfall: despite being added after the catch-all, this is combined with the other 'Steve' expectations.
// Because `getByName('Steve')` was specified before `getByName(anyString())`, this is actually reachable.
// If you remove all three `Steve` expectations above, then this expectation becomes unreachable.
when(myMock.members.getByName('Steve').job.ranking).useValue(12);

instance(myMock).members.getByName('Steve').job.getCompany().name // 'Pixar'
instance(myMock).members.getByName('Steve').address               // Error: Unexpected member access
instance(myMock).members.getByName('John').address                // default address
instance(myMock).members.getByName('Steve').job                   // {}
instance(myMock).members.getByName('Steve').job.ranking           // 12
```

To avoid the pitfall shown in the example above, always declare your expectations from the most specific to the most general.

## <a name="result-mocking"></a> Mocking the results

There are many ways you can define what gets returned from a matched call or member access.

### <a name="use-value"></a> Using a value

```ts
// Mock the return value of a method
when(myMock.sayMyName()).return('Heisenberg');
// Mock the value of a property or getter
when(myMock.name).useValue('Heisenbug');

instance(myMock).sayMyName(); // Heisenberg
instance(myMock).name; // Heisenbug
```

### <a name="call-fake"></a> Using a fake

Use a fake if you need some test code to run when the method is called on the mock.

```ts
when(myMock.divide(anyNumber(), 0)).callFake((a, b) => {
    expect(a).toBe(42);
});
```

Note that faking a call with no arguments is the same as replacing the method with a custom function
```ts
when(myMock.doSomething()).callFake(() => 'something was done');
// Is equivalent to:
when(myMock.doSomething).useValue(() => 'something was done');
```

### <a name="call-through"></a> Using the real object

You may delegate method calls and member access to the backing instance of [backed](#backed-vs-virtual) mocks.

```ts
const myMock = mock({
    sayHello: (name: string) => `Hello ${name}!`},
    name: 'Willy'
);
when(myMock.sayHello()).callThrough();
when(myMock.name).useActual();

instance(myMock).sayHello('beautiful'); // "Hello beautiful!"
instance(myMock).name; // "Willy"
```

### <a name="throw-error"></a> Throw an error

```ts
when(myMock.divide(anyNumber(), 0)).throw(new Error('Division by zero'));
// is equivalent to:
when(myMock.divide(anyNumber(), 0)).call(() => { throw new Error('Division by zero') });

instance(myMock).divide(22, 0); // throws: Error('Division by zero')
```

### <a name="throw-error"></a> Promises

OmniMock provides helpers for dealing with promises

```ts
when(myMock.fetchRemoteData(1)).resolve('the data');
when(myMock.fetchRemoteData(0)).rejet('Invalid id');
```


## <a name="verification"></a> Verification

By mocking, you control interactions of the tested code with the external world. Verification is the process of ensuring that the tested code made the right number of calls.  
By deault, any call which is not matched by any expectation throws an exception. Expectations accept any number of calls by default. You may customize how many calls of a specific expectation you expect to see with _quantifiers_.  
At the end of the test, you should call `verify` to ensure all expected calls were realized.

```ts
import { verify } from 'omnimock';

when(myMock.getName()).return('apollo').times(2);
when(myMock.luckyNumber).useValue(23).atLeastOnce();

verify(myMock); // Throws an error because the expectations above were not met

instance(myMock).getName();
instance(myMock).luckyNumber;

verify(myMock); // Throws an error because myMock.getName was expected twice but it was called only once

// You can verify a subset of the expectations.
verify(myMock.luckyNumber); // This does not throw

when(myMock.getHero('Bilbo').speak()).return('Time for some tea').once();

verify(myMock.getHero('Bilbo')); // throws an error because speak() was expected once but was not called
verify(myMock.getHero('Gloin')); // Does not throw
// Callign verify on the base mock verifies all expectations, however deeply nested
verify(myMock); // Throws
```

### <a name="quantifiers"></a> Quantifiers

Quantifiers are additional calls you can make on an expectation to specify how many times this expectation should be matched.

```ts
when(myMock.find('dogs')).return([]).once();
when(myMock.find('cats')).return([]).atLeastOnce();
when(myMock.find('snails')).return([]).atMostOnce();
when(myMock.find('mice')).return([]).anyTimes(); // This is the default behavior
when(myMock.find('deers')).return([]).times(5);
```


### <a name="verify"></a> Fail on unrealized expectation

```ts
when(myMock.find('bears')).return(['teddy']).atLeastOnce();

verify(myMock); // Error: unmatched expectation: myMock.find('bears'), expected at least one calls but got 0
```

Place a call to `verify` in the teardown of your test to make sure no expectation goes unnoticed.

```ts
afterEach(() => {
    verify(myMock);
});
```

### <a name="unexpected-call"></a> Fail on unexpected call or access

Any call which does not match any expectation will throw an Error.

```ts
instance(myMock).find('bears'); // Error: Unexpected call to myMock.find('bears')
```

## <a name="misc"></a> Misc

### <a name="debugging"></a> Debugging

OmniMock prints helpful error messages when something goes wrong to help you quickly identify the error.
But there may be times when your mock got really complex and you don't understand why some call was not matched the way you wanted.  
For those times we made the `debug` utility. Use it to print all of the expectations currently registered on a mock:

```ts
import {  debug } from 'omnimock';

console.log(debug(myMock));
```

### <a name="resetting"></a> Resetting expectations

Reset all or part of the expectations set on a mock using the `reset` function.

```ts
import { reset } from 'omnimock';

when(myMock.getName()).return('apollo');
when(myMock.luckyNumber).useValue(23);
// Reset all expectations set on this mock
reset(myMock);
instance(myMock).getName();     // Error: Unexpected access to getName
instance(myMock).luckyNumber;   // Error: Unexpected access to getName

when(myMock.getName()).return('apollo');
when(myMock.luckyNumber).useValue(23);
// Reset only the getName member access and leave everything else
reset(myMock.getName);
instance(myMock).getName();     // Error: Unexpected access to getName
instance(myMock).luckyNumber;   // 23
```

### <a name="capture"></a> Capturing values

You can record a value passed to a mock from the tested code in order to use it in the test suite.

To do so, use a fake call and save the value to the closure of the test.

```ts
let captured: string = '';

when(myMock.getContact(anyString())).call((contact) => {
    captured = contact;
    return mockInstance();
});

instance(myMock).getContact('Mom');

expect(captured).toBe('Mom');
```

# <a name="advanced-topics"></a> Advanced topics

## <a name="design"></a> Design

OmniMock is merely a DSL to configure an ES6 [Proxy](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy) to behave a specific way, with a sprinkle of verification logic to check if the proxy was used as intended.

Both mock controls and mock instances are ES6 Proxies. All of the calls or member accesses on these objects go through the internals of OmniMock, where they are dissected and registered. The state of the mock is stored internally in closures which are not accessible from the outside world.

The mock control exposes some metadata which public APIs like `when()` and `instance()` use to interact with the mock's state. This metadata is actually encoded in the type system and this is why TypeScript is able to tell a mock control from a mock instance, even though they look like they have the same type.

## <a name="backed-vs-virtual"></a> Backed mocks vs virtual mocks

As stated in the previous section, all mocks in OmniMock are ES6 Proxies. A mock captures any incoming call or property access and applies some logic to determine what to do next.  
If the proxy has access to an actual instance of the type it is mocking, we say that this proxy is **backed** (as in, it has a **backing instance**). The proxy will inherit some properties of the backing instance. Virtual proxies on the other hand behave in a more generic way.  
The table below summarizes the differences between a backed mock and a virtual mock.

| Property                   | Virtual    | Backed          |
|----------------------------|------------|-----------------|
| constructor (instanceof)   |      ✗     |        ✓        |
| enumerate original props   |✗<sup>1</sup>|       ✓        |
| callable                   | always yes | same as backing |

<sup>1</sup>Only those properties which have been `when`-ed are enumerable. There is no way to retrieve the original properties at runtime.

## Limitations

- Symbol lookups cannot be mocked. This is not a fundamental limitation of the design, it is just that I have not found a use for it yet.
- Virtual mocks don't support property enumeration and other reflective operations. See [virtual mocks vs backed mocks](#backed-vs-virtual).
- OmniMock does not patch objects in-place. Some mocking frameworks will completely override an external package such that static references to this package resolve to the mocks instead of the original. We see in-place patching as a hacky technique used to work around poorly designed software. Modern software makes use of dependency injection and does not make static calls. OmniMock is well suited for modern stacks such as [Angular](http://angular.io), [Aurelia](https://aurelia.io/) or any front- or back-end project using an [IoC](https://en.wikipedia.org/wiki/Inversion_of_control) framework like [InversifyJS](http://inversify.io/), but it is not recommended for legacy apps which do not follow engineering best practices.

# Similar libraries

Because there are many ways to design a mocking library, there are many mocking libraries. [This page](https://github.com/hmil/omnimock/wiki/Comparison-of-TypeScript-mocking-frameworks/) describes the differences between some popular choices.
