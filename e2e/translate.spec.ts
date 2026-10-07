import { expect, test } from "@playwright/test";

/**
 * A notice in another language is translated by the browser's own on-device translator when it has
 * one (7 Oct 2026). The translator is faked here, so the test does not depend on which browser
 * build the runner has; what is checked is the wiring: the button appears only when the browser
 * can translate, the English text is what gets decoded, and the seller is told it is a machine
 * translation to check against the original.
 */
const GERMAN =
  "Betreff: Ihr Verkäuferkonto wurde deaktiviert\n\nIhr Amazon Verkäuferkonto wurde deaktiviert, weil wir Beschwerden von Kunden über die Echtheit Ihrer Artikel erhalten haben. Sie können innerhalb von 60 Tagen Einspruch einlegen und einen Aktionsplan einreichen. Bitte senden Sie uns Rechnungen Ihrer Lieferanten für die betroffenen Artikel. Das Konto wurde nicht gelöscht.";
const ENGLISH =
  "Subject: Your selling account has been deactivated\n\nYour Amazon selling account has been deactivated because we received complaints from customers about the authenticity of your items. You may appeal within 60 days and submit a plan of action. Please send us invoices from your suppliers for the affected items.";

test("a German notice is translated on the device, decoded, and flagged as a machine translation", async ({
  page,
}) => {
  await page.addInitScript((english) => {
    (window as unknown as { Translator: unknown }).Translator = {
      availability: async () => "available",
      create: async () => ({ translate: async () => english, destroy: () => undefined }),
    };
  }, ENGLISH);
  await page.goto("/decode");
  await page.getByLabel("Your notice").fill(GERMAN);
  await page.getByRole("button", { name: "Decode", exact: true }).click();

  await page.getByRole("button", { name: "Translate to English on this device" }).click();
  await expect(
    page.getByText(/Translated from German by your browser, on this device/),
  ).toBeVisible();
  // The English text is what was decoded and is shown marked up.
  await expect(
    page.getByText(/complaints from customers about the authenticity/).first(),
  ).toBeVisible();
  await expect(page.getByText("Inauthentic item complaint").first()).toBeVisible();
});

test("with no translator in the browser there is no translate button, and the old choice remains", async ({
  page,
}) => {
  await page.addInitScript(() => {
    delete (window as unknown as { Translator?: unknown }).Translator;
  });
  await page.goto("/decode");
  await page.getByLabel("Your notice").fill(GERMAN);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await expect(page.getByRole("button", { name: /Read it anyway/ })).toBeVisible();
  await expect(page.getByRole("button", { name: /Translate to English/ })).toHaveCount(0);
});

test("a translator that fails says so and keeps the notice", async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { Translator: unknown }).Translator = {
      availability: async () => "available",
      create: async () => ({
        translate: async () => {
          throw new Error("model gone");
        },
      }),
    };
  });
  await page.goto("/decode");
  await page.getByLabel("Your notice").fill(GERMAN);
  await page.getByRole("button", { name: "Decode", exact: true }).click();
  await page.getByRole("button", { name: "Translate to English on this device" }).click();
  await expect(page.getByText(/Your browser could not translate this/)).toBeVisible();
  await expect(page.getByLabel("Your notice")).toHaveValue(GERMAN);
});
