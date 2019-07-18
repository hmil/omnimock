import { mock, when, instance } from '.';

interface Cat {
    name: string;

    fur: 'short' | 'heavy' | 'fluffy' | 'none';
}

type RefreshStatus = 'up-to-date' | 'updated';

abstract class CatsService {

    abstract getAllCats(): Cat[];

    abstract getCatByName(name: string): Cat;

    abstract refresh(): Promise<RefreshStatus>;

    something: string = 'foo';
}

const myMock = mock<CatsService>();

// when(myMock.getAllCats()).return([]);
// when(myMock.something).useValue('something else');
// when(myMock.refresh()).resolve('up-to-date');
// when(myMock.getCatByName('meow')).call((name) => ({ name, fur: 'short'}));
// when(myMock.refresh).useValue(async () => 'up-to-date');

when(myMock.getCatByName).useValue((name) => ({ name, fur: 'short'}));
when(myMock.refresh()).return(Promise.resolve('up-to-date'));
const myInstance = instance(myMock);

console.log(myInstance.getCatByName('meow').name)
// console.log(myInstance.something)
myInstance.refresh().then(v => console.log(v));
