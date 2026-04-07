import { describe, it, expect } from 'vitest';
import { RingBuffer } from '../src/store/ring-buffer';

describe('RingBuffer', () => {
  it('stores items up to capacity', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    expect(buf.toArray()).toEqual([1, 2, 3]);
    expect(buf.size).toBe(3);
  });

  it('overwrites oldest when full', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.push(3);
    buf.push(4);
    expect(buf.toArray()).toEqual([2, 3, 4]);
    expect(buf.size).toBe(3);
  });

  it('clears all items', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(1);
    buf.push(2);
    buf.clear();
    expect(buf.toArray()).toEqual([]);
    expect(buf.size).toBe(0);
  });

  it('is iterable', () => {
    const buf = new RingBuffer<number>(3);
    buf.push(10);
    buf.push(20);
    expect([...buf]).toEqual([10, 20]);
  });

  it('returns items in insertion order after wrap', () => {
    const buf = new RingBuffer<number>(3);
    for (let i = 1; i <= 7; i++) buf.push(i);
    expect(buf.toArray()).toEqual([5, 6, 7]);
  });
});
