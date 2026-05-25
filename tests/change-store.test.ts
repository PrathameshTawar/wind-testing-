import { ChangeStore } from '../src/store';
import { FileChangeEvent } from '../src/watcher';

function makeEvent(filePath: string, type: FileChangeEvent['type'], offset = 0): FileChangeEvent {
  return {
    filePath,
    type,
    timestamp: new Date(Date.UTC(2024, 0, 1, 0, 0, offset)),
  };
}

describe('ChangeStore in-memory tests', () => {
  test('1. addChange + getRecent returns entries', () => {
    const store = new ChangeStore(10);

    store.addChange(makeEvent('/tmp/a.ts', 'add'));

    expect(store.getRecent()).toEqual([expect.objectContaining({ filePath: '/tmp/a.ts' })]);
  });

  test('2. getRecent returns newest first', () => {
    const store = new ChangeStore(10);

    store.addChange(makeEvent('/tmp/old.ts', 'add', 1));
    store.addChange(makeEvent('/tmp/new.ts', 'change', 2));

    expect(store.getRecent(2)).toEqual([
      expect.objectContaining({ filePath: '/tmp/new.ts' }),
      expect.objectContaining({ filePath: '/tmp/old.ts' }),
    ]);
  });

  test('3. maxSize of 5 keeps exactly the 5 most recent after adding 10 changes', () => {
    const store = new ChangeStore(5);

    for (let i = 0; i < 10; i++) {
      store.addChange(makeEvent(`/tmp/${i}.ts`, 'change', i));
    }

    expect(store.getSize()).toBe(5);
    expect(store.getAll().map(change => change.filePath)).toEqual([
      '/tmp/9.ts',
      '/tmp/8.ts',
      '/tmp/7.ts',
      '/tmp/6.ts',
      '/tmp/5.ts',
    ]);
  });

  test('4. maxSize of 0 does not crash and stores no entries', () => {
    const store = new ChangeStore(0);

    expect(() => store.addChange(makeEvent('/tmp/a.ts', 'add'))).not.toThrow();
    expect(store.getSize()).toBe(0);
  });

  test('5. Negative maxSize throws in the constructor', () => {
    expect(() => new ChangeStore(-1)).toThrow(/maxSize/i);
  });

  test('6. getByType filters correctly', () => {
    const store = new ChangeStore(10);

    store.addChange(makeEvent('/tmp/a.ts', 'add'));
    store.addChange(makeEvent('/tmp/b.ts', 'change'));

    expect(store.getByType('change')).toEqual([expect.objectContaining({ filePath: '/tmp/b.ts' })]);
  });

  test('7. getByType for an absent type returns []', () => {
    const store = new ChangeStore(10);

    store.addChange(makeEvent('/tmp/a.ts', 'add'));

    expect(store.getByType('delete')).toEqual([]);
  });

  test('8. 100 concurrent Promise.all addChange calls all land', async () => {
    const store = new ChangeStore(100);

    await Promise.all(
      Array.from({ length: 100 }, (_, i) =>
        Promise.resolve().then(() => store.addChange(makeEvent(`/tmp/${i}.ts`, 'change', i))),
      ),
    );

    expect(store.getSize()).toBe(100);
  });
});
