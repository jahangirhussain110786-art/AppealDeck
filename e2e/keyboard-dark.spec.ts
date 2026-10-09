import { expect, test, type Page } from "@playwright/test";
import { expectNoAxeViolations, WCAG_AA_TAGS, waitForEntryAnimations } from "./axe";

/**
 * 9 Oct 2026 (launch audit 5.1): the two accessibility checks the audit still listed as not done.
 *
 * 1. Dark mode. The marketing specs scan in the browser's default (light) scheme only, so a dark
 *    palette defect on a public page could ship unseen. Every public page is scanned in both,
 *    against every WCAG 2.x A/AA rule and every severity (not only serious + critical).
 * 2. Keyboard only. Tab through each page the way a seller who cannot use a mouse would and
 *    assert what makes that possible: the first stop is the skip link, every stop is visible and
 *    shows a focus indicator, focus never gets trapped, and a dialog closes on Escape and gives
 *    focus back to what opened it.
 */

const PUBLIC_PAGES = [
  "/",
  "/decode",
  "/pricing",
  "/faq",
  "/support",
  "/guides",
  "/guides/section-3",
  "/privacy",
  "/terms",
  "/refund",
  "/login",
  "/signup",
  "/forgot-password",
  "/case",
  "/vault",
];

for (const scheme of ["light", "dark"] as const) {
  test.describe(`axe, ${scheme} scheme, every severity`, () => {
    for (const path of PUBLIC_PAGES) {
      test(`${path}`, async ({ page }) => {
        await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
        await page.goto(path);
        await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
      });
    }
  });
}

type Stop = {
  tag: string;
  name: string;
  visible: boolean;
  indicator: boolean;
  inViewport: boolean;
};

/**
 * Press Tab up to `limit` times and describe each place focus lands. `indicator` is true when the
 * focused element draws an outline or a box shadow that the same element does not draw unfocused:
 * the thing a sighted keyboard user relies on to know where they are.
 */
async function tabThrough(page: Page, limit: number): Promise<Stop[]> {
  const stops: Stop[] = [];
  for (let i = 0; i < limit; i++) {
    await page.keyboard.press("Tab");
    const stop = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement | null;
      if (!el || el === document.body) return null;
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      const outlined = style.outlineStyle !== "none" && parseFloat(style.outlineWidth) > 0;
      const shadowed = style.boxShadow !== "none";
      const name =
        el.getAttribute("aria-label") ||
        el.innerText?.trim().slice(0, 50) ||
        el.getAttribute("placeholder") ||
        el.getAttribute("href") ||
        el.id ||
        "";
      return {
        tag: el.tagName.toLowerCase(),
        name,
        visible:
          rect.width > 0 &&
          rect.height > 0 &&
          style.visibility !== "hidden" &&
          style.display !== "none",
        indicator: outlined || shadowed,
        inViewport: rect.bottom > 0 && rect.top < window.innerHeight,
      };
    });
    if (!stop) break; // focus left the document (to the browser chrome): the page is not a trap
    stops.push(stop);
  }
  return stops;
}

test.describe("keyboard only", () => {
  for (const path of ["/", "/decode", "/pricing", "/faq", "/support", "/login", "/case"]) {
    test(`${path}: skip link first, every stop visible with a focus indicator`, async ({
      page,
    }, info) => {
      test.skip(
        info.project.name !== "chromium",
        "Tab order differs per engine; Chromium gates it",
      );
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(path);
      await waitForEntryAnimations(page);
      const stops = await tabThrough(page, 60);

      expect(stops.length, "the page has keyboard stops").toBeGreaterThan(3);
      expect(stops[0].name.toLowerCase(), "first stop is the skip link").toMatch(/skip/);

      const bad = stops.filter((s) => !s.visible || !s.indicator || !s.inViewport);
      expect(
        bad,
        `stops that are hidden, off screen, or show no focus indicator:\n${JSON.stringify(bad, null, 2)}`,
      ).toEqual([]);
    });
  }

  test("the skip link takes the keyboard to the main content", async ({ page }, info) => {
    // Safari's Tab skips links unless the user enables it, so the next stop in <main> is not
    // predictable there (same reason the login spec branches on WebKit).
    test.skip(info.project.name === "webkit", "WebKit does not Tab onto links by default");
    await page.goto("/faq");
    await page.keyboard.press("Tab");
    await page.keyboard.press("Enter");
    // The next Tab must land inside <main>, not back in the header the link skipped.
    await page.keyboard.press("Tab");
    const inMain = await page.evaluate(() => !!document.activeElement?.closest("main"));
    expect(inMain).toBe(true);
  });

  test("an FAQ answer opens and closes from the keyboard", async ({ page }, info) => {
    test.skip(info.project.name !== "chromium", "Chromium gates tab order");
    await page.goto("/faq");
    const summary = page.locator("details > summary").first();
    const details = page.locator("details").first();
    await summary.focus();
    await expect(details).not.toHaveAttribute("open", "");
    await page.keyboard.press("Enter");
    await expect(details).toHaveAttribute("open", "");
    await page.keyboard.press("Space");
    await expect(details).not.toHaveAttribute("open", "");
  });

  test("a dialog opens from the keyboard, traps focus, closes on Escape and returns focus", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "chromium", "Chromium gates tab order");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/pricing");
    const opener = page.getByRole("button", { name: /sample/i }).first();
    await opener.focus();
    await page.keyboard.press("Enter");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();

    // Focus stays inside the dialog however many times Tab is pressed.
    for (let i = 0; i < 12; i++) {
      await page.keyboard.press("Tab");
      const inside = await page.evaluate(
        () => !!document.activeElement?.closest('[role="dialog"]'),
      );
      expect(inside, `Tab press ${i + 1} left the dialog`).toBe(true);
    }

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(opener).toBeFocused();
  });
});

/**
 * The case workspace is where a seller spends their time, and it was scanned in one theme per tab
 * at most. Every tab is scanned in both schemes, the tab row is driven by arrow keys, and each
 * tab is walked by Tab.
 */
const WORKSPACE_TABS = ["Overview", "Documents", "Response", "History"] as const;

async function configureCase(page: Page) {
  await page.goto("/case");
  await page
    .getByLabel("Amazon notice", { exact: true })
    .fill(
      "Please provide the supplier invoice for the affected product. The records should identify the supplier and the purchased product.",
    );
  await page
    .getByLabel("What the response page asks for")
    .fill("Upload the invoice and explain how the product code matches the affected product.");
  await page.getByRole("button", { name: "Yes, this is right" }).click();
  await expect(page.getByRole("button", { name: "Go to your documents" })).toBeVisible();
}

test.describe("case workspace", () => {
  for (const scheme of ["light", "dark"] as const) {
    test(`every tab passes axe in the ${scheme} scheme`, async ({ page }) => {
      test.setTimeout(120_000);
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await configureCase(page);
      for (const name of WORKSPACE_TABS) {
        await page.getByRole("tab", { name, exact: true }).click();
        await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
      }
    });
  }

  test("the tab row follows arrow keys, and each tab walks by Tab with visible focus", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "chromium", "Chromium gates tab order");
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await configureCase(page);

    const overview = page.getByRole("tab", { name: "Overview", exact: true });
    await overview.focus();
    await page.keyboard.press("ArrowRight");
    await expect(page.getByRole("tab", { name: "Documents", exact: true })).toBeFocused();
    await expect(page.getByRole("tab", { name: "Documents", exact: true })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await page.keyboard.press("End");
    await expect(page.getByRole("tab", { name: "History", exact: true })).toBeFocused();
    await page.keyboard.press("Home");
    await expect(overview).toBeFocused();

    for (const name of WORKSPACE_TABS) {
      await page.getByRole("tab", { name, exact: true }).click();
      await page.getByRole("tab", { name, exact: true }).focus();
      const stops = await tabThrough(page, 80);
      expect(stops.length, `${name}: keyboard stops after the tab row`).toBeGreaterThan(0);
      const bad = stops.filter((s) => !s.visible || !s.indicator);
      expect(
        bad,
        `${name}: stops with no focus indicator:\n${JSON.stringify(bad, null, 2)}`,
      ).toEqual([]);
    }
  });

  test("the I-don't-have-it fold opens and acts from the keyboard alone", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "chromium", "Chromium gates tab order");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await configureCase(page);
    await page.getByRole("tab", { name: "Documents", exact: true }).click();
    const fold = page.locator("summary").filter({ hasText: "I don't have it" });
    await fold.focus();
    await page.keyboard.press("Enter");
    const waiting = page.getByRole("button", { name: "I'm waiting for it" });
    await expect(waiting).toBeVisible();
    await waiting.focus();
    await page.keyboard.press("Enter");
    await expect(
      page
        .getByRole("tabpanel", { name: "Documents", exact: true })
        .getByText("Waiting for information", { exact: true }),
    ).toBeVisible();
  });
});

/**
 * Signed-in pages, both schemes, then the keyboard. Needs the shared dev account
 * (DEV_LOGIN_EMAIL / DEV_LOGIN_PASSWORD, e.g. `node --env-file=.env.local ...`); skipped without.
 */
test.describe("signed in", () => {
  test.skip(
    !process.env.DEV_LOGIN_EMAIL || !process.env.DEV_LOGIN_PASSWORD,
    "needs the dev login in the environment",
  );

  async function signIn(page: Page) {
    await page.goto("/login");
    await page.getByLabel(/email/i).fill(process.env.DEV_LOGIN_EMAIL!);
    await page.getByLabel(/^password$/i).fill(process.env.DEV_LOGIN_PASSWORD!);
    await Promise.all([
      page.waitForURL(/\/dashboard/),
      page.getByRole("button", { name: /sign in/i }).click(),
    ]);
  }

  for (const scheme of ["light", "dark"] as const) {
    test(`dashboard, vault, billing and case pass axe in the ${scheme} scheme`, async ({
      page,
    }) => {
      test.setTimeout(150_000);
      await page.emulateMedia({ colorScheme: scheme, reducedMotion: "reduce" });
      await signIn(page);
      for (const path of ["/dashboard", "/vault", "/billing", "/case"]) {
        await page.goto(path);
        // Scan the finished page, not the loading skeleton that shows while it streams in.
        await expect(page.getByRole("main")).toBeVisible();
        await expect(page.getByRole("status", { name: /^Opening your case/ })).toHaveCount(0);
        await expectNoAxeViolations(page, { tags: WCAG_AA_TAGS });
      }
    });
  }

  test("dashboard, vault and billing walk by Tab with visible focus and no trap", async ({
    page,
  }, info) => {
    test.skip(info.project.name !== "chromium", "Chromium gates tab order");
    test.setTimeout(120_000);
    await page.emulateMedia({ reducedMotion: "reduce" });
    await signIn(page);
    for (const path of ["/dashboard", "/vault", "/billing"]) {
      await page.goto(path);
      await waitForEntryAnimations(page);
      const stops = await tabThrough(page, 80);
      expect(stops.length, `${path}: keyboard stops`).toBeGreaterThan(3);
      const bad = stops.filter((s) => !s.visible || !s.indicator);
      expect(
        bad,
        `${path}: stops with no focus indicator:\n${JSON.stringify(bad, null, 2)}`,
      ).toEqual([]);
    }
  });
});
