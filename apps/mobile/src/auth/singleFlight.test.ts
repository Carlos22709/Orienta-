import { singleFlight } from './singleFlight';

/** Promesa que se resuelve cuando la prueba lo decide. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('singleFlight', () => {
  it('comparte una sola llamada entre quienes llegan mientras está en curso', async () => {
    const pending = deferred<string>();
    const fn = jest.fn(() => pending.promise);
    const once = singleFlight(fn);

    const results = Promise.all([once(), once(), once()]);
    pending.resolve('listo');

    await expect(results).resolves.toEqual(['listo', 'listo', 'listo']);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('permite una llamada nueva cuando la anterior terminó', async () => {
    const fn = jest.fn(() => Promise.resolve('ok'));
    const once = singleFlight(fn);

    await once();
    await once();

    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('también libera la cola cuando la llamada falla', async () => {
    const fn = jest
      .fn<Promise<string>, []>()
      .mockRejectedValueOnce(new Error('falla'))
      .mockResolvedValueOnce('ok');
    const once = singleFlight(fn);

    await expect(once()).rejects.toThrow('falla');
    await expect(once()).resolves.toBe('ok');
  });
});
