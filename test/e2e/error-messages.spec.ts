import { anyOf, contains, instance, mock, objectEq, when } from '../../src';
import { CatClass, CatsSecretPlan, Tag } from '../fixtures/classes';

describe('error messages', () => {
    
    describe('the base symbol', () => {
            it('uses the custom name of a virtual mock', () => {
                const catMock = mock<CatClass>('virtual cat');
                expect(() => instance(catMock).purr()).toThrow(/<virtual cat>.purr/);
            });

            it('uses the class name of a class-based backed mock', () => {
                const catMock = mock('catMock', new CatClass('Olinka'));
                when(catMock.purr()).return(undefined).never();
                expect(() => instance(catMock).purr()).toThrow(/<catMock>.purr/);
            });

            it('uses "anonymous class" for anonymous classes', () => {
                const catMock = mock(class { purr() { return 'a'; }});
                expect(() => instance(catMock).purr()).toThrow(/<anonymous class>.purr/);
            });

            it('uses "Object" for inline complete mocks', () => {
                const catMock = mock('catMock', {
                    purr: () => undefined
                });
                when(catMock.purr()).return(undefined).never();
                expect(() => instance(catMock).purr()).toThrow(/<catMock>.purr/);
            });

            it('uses the custom name of a partial-backed mock', () => {
                const catMock = mock<CatClass>('virtual cat', {
                    color: 'grey'
                });
                expect(() => instance(catMock).purr()).toThrow(/<virtual cat>.purr/);
            });
    
            it('uses the original name of a class', () => {
                const catMock = mock(CatClass);
                expect(() => instance(catMock).purr()).toThrow(/<CatClass>.purr/);
            });
    });

    describe('unexpected calls', () => {
        it('explains when a member access is unexpected', () => {
            const catMock = mock(CatClass);
            expect(() => instance(catMock).purr()).toThrow(/Unexpected property access: <CatClass>.purr/);
        });
        it('explains when a method call is unexpected', () => {
            const m = mock<() => void>('m');
            expect(() => instance(m)()).toThrow(/Unexpected call: <m>\(\)/);
        });
        it('explains when a member access is called more than expected', () => {
            const catMock = mock(CatClass);
            when(catMock.purr()).return('rrr').once();
            expect(() => instance(catMock).purr()).not.toThrow();
            expect(() => instance(catMock).purr()).toThrow(/Unexpected call: <CatClass>\.purr\(\)/);
        });
    });

    describe('array indices', () => {
        it('says which index was accessed', () => {
            const m = mock<string[]>('arrayMock');
            expect(() => instance(m)[3]).toThrow(/Unexpected property access: <arrayMock>\["3"\]/);
        });
    });

    describe('symbols', () => {
        it('specifies the symbol used', () => {
            const catMock = mock(CatClass);
            expect(() => instance(catMock)[CatsSecretPlan])
                    .toThrow(/Unexpected property access: <CatClass>\[Symbol\(secret plan\)\]/);
        });
    });

    describe('descriptive error messages', () => {
        it('unexpected call shows the other expected calls', () => {
            const catMock = mock(CatClass, {
                food: 'oreos'
            });

            const tag = {
                chip: {
                    id: 1
                },
                manufacturer: {
                    fetch: () => Promise.resolve('ok')
                },
                siblings: []
            };

            when(catMock.setTag(objectEq<Tag>(tag))).return(undefined).once();
            when(catMock.setTag(contains<Tag>({
                chip: tag.chip
            }))).return(undefined).once();
            when(catMock.greet('john')).return('Hey you').atLeastOnce();

            tag.chip = {
                id: 23
            };
            expect(() => instance(catMock).setTag(tag)).toThrow(
`Unexpected call: <CatClass>.setTag(Object(chip,manufacturer,siblings))

The following behaviors were tested but they did not match:

- <CatClass>.setTag(<objectEq(Object(chip,manufacturer,siblings))>) : expected once, received 0
  reason: element $0 doesn't match: object doesn't match:
    - [chip]: object doesn't match:
      - [id]: expected 1 but got 23

- <CatClass>.setTag(<objectContaining(Object(chip))>) : expected once, received 0
  reason: element $0 doesn't match: object doesn't match:
    - [chip]: object doesn't match:
      - [id]: expected 1 but got 23


The backing object is not a function`);
        });

        it('unexpected call shows untried expectations', () => {
            const m = mock<() => void>('m');
            expect(() => instance(m)()).toThrow(`Unexpected call: <m>()
No call behavior was defined on this symbol.


The backing object is not a function`);
        });

        it('unexpected call states that no calls were expected', () => {
            const catMock = mock(CatClass, {
                food: 'oreos'
            });

            when(catMock.greet('jean')).return('Hi jean').once();
            when(catMock.greet('oliver')).return('Hi john').never();
            when(catMock.greet('john')).return('Hi john').once();
            when(catMock.greet(anyOf('jack', 'jordan'))).return('Hey you').atLeastOnce();

            expect(() => instance(catMock).greet('oliver')).toThrow(
`Unexpected call: <CatClass>.greet("oliver")

The following behavior matched, but that behavior was expected never and was received once.
<CatClass>.greet("oliver")

Previous matching calls were:
0. <CatClass>.greet("oliver")

The following behaviors were tested but they did not match:

- <CatClass>.greet("jean") : expected once, received 0
  reason: element $0 doesn't match: expected "jean" but got "oliver"

These behaviors were not tested because the matching call was defined first and therefore had precendence.
- <CatClass>.greet("john")
- <CatClass>.greet(<anyOf("jack", "jordan")>)


The backing object is not a function`);
        });

        it('unexpected member access shows the expected member accesses and backing props', () => {
            const catMock = mock(CatClass, {
                food: 'oreos'
            });

            when(catMock.tag.chip.id).useValue(22);
            when(catMock.name).useValue('Olinka').once();
            when(catMock.getTag).callThrough();
            when(catMock[CatsSecretPlan]).useValue('kill all humans');

            expect(() => instance(catMock).color).toThrow(
`Unexpected property access: <CatClass>.color

Behviors were defined for the following members:
- .tag
- .name
- .getTag
- [Symbol(secret plan)]

The backing instance has the following properties defined:
- .food
`);
        });

        it('unexpected constructor states that no constructors were expected', () => {
            const ctrMock = mock<{ctr: typeof CatClass}>('ctrMock');

            when(new ctrMock.ctr('jean')).callThrough().once();
            when(new ctrMock.ctr('oliver')).callThrough().never();
            when(new ctrMock.ctr('john')).callThrough().once();

            expect(() => new (instance(ctrMock)).ctr('oliver')).toThrow(
`Unexpected call: new <ctrMock>.ctr("oliver")

The following behavior matched, but that behavior was expected never and was received once.
new <ctrMock>.ctr("oliver")

Previous matching calls were:
0. new <ctrMock>.ctr("oliver")

The following behaviors were tested but they did not match:

- new <ctrMock>.ctr("jean") : expected once, received 0
  reason: element $0 doesn't match: expected "jean" but got "oliver"

These behaviors were not tested because the matching call was defined first and therefore had precendence.
- new <ctrMock>.ctr("john")


The backing object is not a function`);
        });

        it('unexpected constructor states that no constructors were expected', () => {
            const ctrMock = mock<{ getCtr: () => typeof CatClass}>('ctrMock');

            when(new (ctrMock.getCtr())('jean')).callThrough().once();
            when(new (ctrMock.getCtr())('john')).callThrough().once();

            expect(() => new (instance(ctrMock).getCtr())('oliver')).toThrow(
`Unexpected call: new (<ctrMock>.getCtr())("oliver")

The following behaviors were tested but they did not match:

- new (<ctrMock>.getCtr())("jean") : expected once, received 0
  reason: element $0 doesn't match: expected "jean" but got "oliver"

- new (<ctrMock>.getCtr())("john") : expected once, received 0
  reason: element $0 doesn't match: expected "john" but got "oliver"


The backing object is not a function`);
        });
    });
});
