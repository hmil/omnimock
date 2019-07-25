# TS-Mock - Mocks for TypeScript

tsmock is a test mock library for TypeScript, with a focus on strong typing and ease of use.

Unlike other similar libraries, tsmock was built from the ground up for TypeScript and makes no compromise.

# WIP status

- [x] Member access mocking
- [x] Method call mocking
- [x] Through access to instance backed mocks
- [x] Deep property access
- [x] Quantifiers
- [x] Matchers
- [x] Verify all mocks
- [x] Define behavior when setting multiple expectations on same member
- [ ] Test the matchers
- [x] Nice error messages
- [ ] Document
- [ ] Handle templated functions with conditional return value... `getSecretRecipe<T extends string>(s: T): T extends '5cr37' ? { recipe: string } : { error: string };`


## Requirements

tsmock aims to bring the best possible mocking experience in TypeScript with no compromise. This comes at the cost of a few prerequisites:

- TypeScript 3.1 or above
- A runtime which supports [the Proxy API](http://kangax.github.io/compat-table/es6/#test-Proxy) (it can not be polyfilled, but any recent version of Node.js or mainstream browser will do)

## Philosophy

A mock library attempts to fulfill multiple contradictory goals. Each author choses to solve the conflicts in a different way and this is why there are many mocking libraries out there.
ts-mock uses a principled approach to solve these goals in a rational way. We believe that by basing all design decisions on this list, we create something that is not just nice to look at on github, but also increases productivity when used in the real world.

1. **Strong typing** is just as necessary in test code as it is in production code. By using `any` all over the place, or by creating ad-hock objects as mocks, you lose the connection between your production code and your test code. Features like symbol renaming and usage lookup don't apply to your tests which makes it harder to understand and refactor your codebase. What's more, loose types mean your tests might get out of sync without you even noticing, and at some point they basically become dead weight.
2. **Sound design**. When something works, it always works. Some APIs such as that of [substitute](https://github.com/ffMathy/FluffySpoon.JavaScript.Testing.Faking) generate namespace and type conflicts. Then you have to use a workaround if you are unfortunate enough to use the same name as that of a method of the framework, and you need to turn off strict null checking. These exceptions are here because the author chose to favor fewer keystrokes over soundness. In tsmock, the mock control and the mock object are two different objects with different types, which makes for a more robust API with no special cases. No need to disable strict type checking and no risk for your type to collide with that of tsmock.
3. **Ease of use** comes only third in the list. JavaScript is a very flexible language which lets you design APIs however you like them. Some authors get carried away and bundle as much "nice to haves" as they can without thinking about soundness or type safety.
  That being said, one likes a nice API. That is why tsmock offers powerful utilities such as automatic chaining for deeply nested properties, a single entry point to generate any kind of mock, wether it's a class instance, interface, function or object.
  Helpers like `.resolve` and `.reject` help you reduce the boilerplate without losing any type safety.

## Features

- Types of mock
    - Mock a function (aka. "spy" in jasmine)
    - Mock a class from a constructor
    - Mock a class from its type only
    - Mock an interface
    - Mock an already instantiated object
- Matching
    - Member access
    - Method or function call
    - Function arguments
      - List of argument matchers
    - Deeply nested properties (aka. _automatic chaining_)
- Mocking
    - Using a value
    - Using a fake
    - Using the real object
    - Throw an error
    - Promises
- Verification
    - Fail on unrealized expectation
    - Fail on unexpected call or access
    - Print all registered expectations (debugging)

## Under the hood

tsmock is an API and utilities built on top of ES6's Proxy.  
The mock control is merely a DSL to configure a Proxy to behave a specific way. On top of that comes a sprinkle of verification logic to check if the proxy was used the way we wanted it to be used.

Both mock controls and mock instances are ES6 Proxies. All of the calls or member accesses on these objects go through the internals of tsmock, where they are dissected and registered. The state of the mock is stored internally in closures which are not accessible from the outside world.

The mock control exposes some metadata which public APIs like `when()` and `instance()` use to interact with the mock's state. This metadata is actually encoded in the type system and this is why TypeScript is able to tell a mock control from a mock instance, even though they look like they have the same type.
