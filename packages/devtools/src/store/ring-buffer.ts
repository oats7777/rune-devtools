export class RingBuffer<T> implements Iterable<T> {
  private _buffer: (T | undefined)[];
  private _head = 0;
  private _size = 0;
  private _capacity: number;

  constructor(capacity: number) {
    this._capacity = capacity;
    this._buffer = new Array(capacity);
  }

  get size(): number {
    return this._size;
  }

  get capacity(): number {
    return this._capacity;
  }

  push(item: T): void {
    const index = (this._head + this._size) % this._capacity;
    if (this._size === this._capacity) {
      this._head = (this._head + 1) % this._capacity;
    } else {
      this._size++;
    }
    this._buffer[index] = item;
  }

  clear(): void {
    this._buffer = new Array(this._capacity);
    this._head = 0;
    this._size = 0;
  }

  toArray(): T[] {
    const result: T[] = [];
    for (let i = 0; i < this._size; i++) {
      result.push(this._buffer[(this._head + i) % this._capacity]! as T);
    }
    return result;
  }

  [Symbol.iterator](): Iterator<T> {
    let i = 0;
    return {
      next: () => {
        if (i < this._size) {
          const value = this._buffer[(this._head + i) % this._capacity]! as T;
          i++;
          return { value, done: false };
        }
        return { value: undefined, done: true } as IteratorReturnResult<undefined>;
      },
    };
  }
}
