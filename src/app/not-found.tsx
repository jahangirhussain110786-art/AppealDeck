import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col items-start px-4 py-24">
      <p className="text-sm font-medium text-accent">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-gray-100">Page not found</h1>
      <p className="mt-3 text-sm text-gray-400">
        The page you were looking for does not exist or has moved.
      </p>
      <Link
        href="/"
        className="mt-6 rounded-lg bg-accent px-5 py-2 text-sm font-semibold text-black"
      >
        Back to home
      </Link>
    </main>
  );
}
