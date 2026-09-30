import { afterEach, describe, expect, it } from "vitest";
import { ensurePromiseWithResolvers } from "./promiseWithResolvers";

type WithResolvers = typeof Promise & { withResolvers?: unknown };
/** Not in the ES2022 library this project compiles against. */
interface Resolvers<T> {
  promise: Promise<T>;
  resolve: (value: T | PromiseLike<T>) => void;
  reject: (reason?: unknown) => void;
}
const original = (Promise as WithResolvers).withResolvers;

afterEach(() => {
  (Promise as WithResolvers).withResolvers = original;
});

/**
 * pdf.js calls Promise.withResolvers unguarded and neither of its builds polyfills it, so on a
 * browser without it (Safari before 17.4, Chrome before 119) every on-device reading failed.
 */
describe("Promise.withResolvers for older browsers", () => {
  it("adds a working one when the browser has none", async () => {
    delete (Promise as WithResolvers).withResolvers;
    expect(typeof (Promise as WithResolvers).withResolvers).toBe("undefined");
    ensurePromiseWithResolvers();
    const { promise, resolve } = (
      Promise as unknown as { withResolvers: <T>() => Resolvers<T> }
    ).withResolvers<number>();
    resolve(42);
    await expect(promise).resolves.toBe(42);
  });

  it("can reject as well as resolve", async () => {
    delete (Promise as WithResolvers).withResolvers;
    ensurePromiseWithResolvers();
    const { promise, reject } = (
      Promise as unknown as { withResolvers: <T>() => Resolvers<T> }
    ).withResolvers<void>();
    reject(new Error("no"));
    await expect(promise).rejects.toThrow("no");
  });

  it("leaves a browser's own version alone", () => {
    const own = function () {
      return {};
    };
    (Promise as WithResolvers).withResolvers = own;
    ensurePromiseWithResolvers();
    expect((Promise as WithResolvers).withResolvers).toBe(own);
  });
});
