import { describe, expect, it } from 'vitest';
import { Orchestrator } from '../orchestrator';

describe('Orchestrator', () => {
  it('runs steps in order and returns fulfilled results (each step receives the original input)', async () => {
    const orchestrator = new Orchestrator<number>([
      { name: 'double', execute: (n) => n * 2 },
      { name: 'addOne', execute: (n) => n + 1 },
    ]);

    const results = await orchestrator.run(3);

    expect(results).toHaveLength(2);
    // Both steps receive the same original input (3), not chained outputs
    expect(results[0]).toEqual({ name: 'double', status: 'fulfilled', value: 6 }); // 3 * 2
    expect(results[1]).toEqual({ name: 'addOne', status: 'fulfilled', value: 4 }); // 3 + 1
  });

  it('stops on error by default', async () => {
    const orchestrator = new Orchestrator<number>([
      {
        name: 'fail',
        execute: () => {
          throw new Error('boom');
        },
      },
      { name: 'never', execute: (n) => n },
    ]);

    const results = await orchestrator.run(1);

    expect(results).toHaveLength(1);
    expect(results[0].status).toBe('rejected');
    expect(results[0].name).toBe('fail');
  });

  it('continues after error when stopOnError is false', async () => {
    const orchestrator = new Orchestrator<number>(
      [
        {
          name: 'fail',
          execute: () => {
            throw new Error('boom');
          },
        },
        { name: 'ok', execute: (n) => n * 10 },
      ],
      { stopOnError: false }
    );

    const results = await orchestrator.run(5);

    expect(results).toHaveLength(2);
    expect(results[0].status).toBe('rejected');
    expect(results[1]).toEqual({ name: 'ok', status: 'fulfilled', value: 50 });
  });

  it('supports async steps', async () => {
    const orchestrator = new Orchestrator<string>([
      {
        name: 'asyncUpper',
        execute: async (s) => {
          return Promise.resolve(s.toUpperCase());
        },
      },
    ]);

    const results = await orchestrator.run('hello');

    expect(results[0]).toEqual({ name: 'asyncUpper', status: 'fulfilled', value: 'HELLO' });
  });

  it('supports addStep chaining', async () => {
    const orchestrator = new Orchestrator<number>();
    orchestrator.addStep({ name: 'negate', execute: (n) => -n });

    const results = await orchestrator.run(7);

    expect(results[0]).toEqual({ name: 'negate', status: 'fulfilled', value: -7 });
  });
});
