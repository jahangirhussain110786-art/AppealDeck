"use client";

import Link from "next/link";

export default function Error({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24">
      <p className="text-sm font-medium text-accent">Something went wrong</p>
      <h1 className="mt-2 text-3xl font-semibold text-gray-100">This page hit an error</h1>
      <p className="mt-3 text-sm text-gray-400">
        An unexpected error occurred while rendering this page. You can try again.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-black"
        >
          Try again
        </button>
        <Link
          href="/"
          className="rounded-lg border border-edge px-5 py-2 text-sm font-semibold text-gray-200"
        >
          Back to home
        </Link>
      </div>
    </main>
  );
}
