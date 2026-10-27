/**
 * The licences page (27 Oct 2026). MIT, ISC and Apache-2.0 all require their notice to travel with
 * the software, so the packages AppealDeck ships are named here with the copyright line each
 * package's own licence file carries, and the full text of each licence is served from
 * `public/licences/`.
 *
 * This is the only place a tool is named with more than its name. The home-page row makes no claim
 * beyond thanks (see `credits.ts`); this page makes none either — it is a notice, not a description.
 *
 * Every runtime dependency must appear here; `licences.test.ts` reads `package.json` and fails if one
 * does not, so a new package cannot ship unattributed.
 */

export type LicenceGroup = {
  id: "mit" | "isc" | "apache";
  name: string;
  href: string;
  packages: { name: string; holder?: string; note?: string }[];
};

export const LICENCES = {
  meta: {
    title: "Licences: the open-source software inside AppealDeck",
    description:
      "The open-source packages AppealDeck ships, the copyright line each one carries, and the full text of the MIT, ISC and Apache licences.",
  },
  title: "Licences",
  lede: "AppealDeck is built on open-source software. Those licences ask us to keep their notices with the software, so they are here.",
  note: "Each copyright line is as the package states it. The full text of each licence is linked at the top of its list.",
  updated: "2026-10-27",
  groups: [
    {
      id: "mit",
      name: "MIT",
      href: "/licences/mit.txt",
      packages: [
        { name: "@radix-ui/react-checkbox", holder: "© 2022 WorkOS" },
        { name: "@radix-ui/react-dialog", holder: "© 2022 WorkOS" },
        { name: "@radix-ui/react-dropdown-menu", holder: "© 2022 WorkOS" },
        { name: "@radix-ui/react-label", holder: "© 2022 WorkOS" },
        { name: "@radix-ui/react-progress", holder: "© 2022 WorkOS" },
        { name: "@radix-ui/react-slot", holder: "© 2022 WorkOS" },
        { name: "@radix-ui/react-tabs", holder: "© 2022 WorkOS" },
        { name: "@radix-ui/react-tooltip", holder: "© 2022 WorkOS" },
        { name: "@supabase/ssr", holder: "© 2022–2023 Supabase, Inc." },
        { name: "@supabase/supabase-js", holder: "© 2020 Supabase" },
        { name: "@tesseract.js-data/eng", note: "English trained data" },
        { name: "@upstash/ratelimit", holder: "© 2021 Upstash, Inc." },
        { name: "@upstash/redis", holder: "© 2021 Upstash, Inc." },
        { name: "clsx", holder: "© Luke Edwards" },
        { name: "framer-motion", holder: "© 2018 Framer B.V." },
        { name: "next", holder: "© 2025 Vercel, Inc." },
        { name: "next-themes", holder: "© 2022 Paco Coursey" },
        { name: "react", holder: "© Meta Platforms, Inc. and affiliates" },
        { name: "react-dom", holder: "© Meta Platforms, Inc. and affiliates" },
        { name: "sonner", holder: "© 2023 Emil Kowalski" },
        { name: "tailwind-merge", holder: "© 2021 Dany Castillo" },
        { name: "zod", holder: "© 2025 Colin McDonnell" },
        { name: "Feather icons", holder: "© 2013–present Cole Bemis", note: "used through Lucide" },
      ],
    },
    {
      id: "isc",
      name: "ISC",
      href: "/licences/isc.txt",
      packages: [{ name: "lucide-react", holder: "© 2026 Lucide Icons and Contributors" }],
    },
    {
      id: "apache",
      name: "Apache 2.0",
      href: "/licences/apache-2.0.txt",
      packages: [
        { name: "class-variance-authority" },
        { name: "dexie", holder: "© 2014–2017 David Fahlander" },
        { name: "pdfjs-dist" },
        { name: "tesseract.js" },
      ],
    },
  ] as LicenceGroup[],
};
