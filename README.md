# TypeScript - EasyMock

Delightful unit test mocking for TypeScript, inspired by [EasyMock](http://easymock.org).

## Motivation

After extensive consideration of existing mocking frameworks for JavaScript and TypeScript, I came to the conclusion that none of them offered the same level of control in an API as expressive as that of easymock, while providing a high level of type safety.

The goals of typescript-easymock are :

- Full (real!) typescript support in the test suites. That means your mocks are type checked, symbol renaming works from the production code to the test code and vice versa, go-to-definition / find usages works on the mocks too.
- Automatic mocking. Modern JavaScript uses classes (and modern TypeScript uses interfaces). These _are_ the structural definition of your objects. Using raw jasmine spies often means you need to explicitly re-create a mock following the structural definition of the object you are mocking. With typescript-easymock you just say which type you want to mock and that mock you obtain.
- Expressive API.

## Usage

### Intro

A test with easymock is broken down in three phases:

1. The record phase. During this phase, invocations of methods of the mocked objects are recorded, but they have no effect. Dummy return values are provided and will be returned by the mocks during the replay phase.
2. The replay phase. This is where you exercise the class under test. When the mocks are invoked, they record the parameters of each call and return the dummy value that was specified in the record phase.
3. The verify phase. After the test class has been exercised, you should verify that the actual calls matched the expected calls.

This is what it looks like in code:

```ts
// The control is a context you use to create mocks and control the current phase
const control = createControl();

// Create a mock for each dependency of the class under test
const dataServiceMock = control.mock(MyDataService);

// The control always starts in record state. This is where we specify the expected behavior
expectCall(dataServiceMock.fetchUserProfile({ id: 3 })).andReturn(Promise.resolve({ name: "John", email: "john.snow@petghost.com" }));

// Switch to replay mode
control.replay();

const testClass = new UserProfileInformation(dataServiceMock);
const name = await testClass.getUserNameById(3);

// Check that all expected calls actually happened
control.verify();

// You can use regular assertions from your testing framework (jasmine/jest in this example)
expect(name).toBe("John"); 
```

### Real world usage

#### Setup and teardown

You will generally create the control and the mocks during the setup of your test (beforeEach), and call `control.verify()` during your test teardown.

For instance, in Jasmine:
```ts
describe('UserProfileInformation', () => {
    let control: IMocksControl
    let testClass: UserProfileInformation
    let dataServiceMock: MyDataService

    beforeEach(() => {
        control = createControl()
        dataServiceMock = control.mock(MyDataService)
        testClass = new UserProfileInformation(dataServiceMock)
    })

    afterEach(() => {
        control.verify();
    })
})
```

> ⚠️ Warning: Always avoid side effects in class constructors. If the constructor makes a call to dataServiceMock
> (and remember that we are still in record mode at this point), then weird things will happen.

#### Match parameters

typescript-easymock provides a collection of matchers to use when you cannot or don't want to specifiy exactly the parameters which will be passed to a mocked method.

```ts
expectCall(dataServiceMock.fetchUserProfile({ id: anyNumber() }))

control.replay()

testClass.getRandomUserName()
```

_Yes, of course in reality you would mock the randomness source used by `getRandomUserName` such that you can inject a well known value... This is just an example._

Here's another example if you would want to check that the parameter is equal by reference to the expected parameter:

```ts
const veryHeavyObject = createSomeVeryComplexObject()
expectCall(queryEngineMock.transform(same(veryHeavyObject)))

control.replay()

// Here, we want to check that the object has been passed as-is and that it was not copied (which would be expensive).
myDatabase.processQuery({ query: veryHeavyObject })
```

