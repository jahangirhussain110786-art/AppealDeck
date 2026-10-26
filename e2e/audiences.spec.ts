import { expect, test, type Page } from "@playwright/test";

/**
 * 22 Oct 2026: the three audiences of the pricing pages (sellers, writers and VA teams, partners),
 * the role question, partner codes, and the chatbot comparison. Nothing here needs sign-in or Paddle.
 */
const audienceNav = (page: Page) => page.getByRole("navigation", { name: "Who is this for?" });
const stored = (page: Page, key: string) => page.evaluate((k) => localStorage.getItem(k), key);

test("while the Account Pass has no price it is shown as Opens soon, with no way to buy it and no counter", async ({
  page,
  request,
}) => {
  test.skip(
    !!process.env.NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS ||
      // One Response on sale puts a second product in the picker, which this case says is absent.
      !!process.env.NEXT_PUBLIC_PADDLE_PRICE_SINGLE_RESPONSE,
    "this is the preview case; the switched-on case is account-pass.spec.ts",
  );
  await page.goto("/pricing");
  if (process.env.NEXT_PUBLIC_PLANS_PREVIEW === "off") {
    await expect(
      page
        .getByRole("list", { name: "Plans for sellers" })
        .getByText("Account Pass", { exact: true }),
    ).toHaveCount(0);
    await expect(page.getByRole("button", { name: "Opens soon" })).toHaveCount(0);
    return;
  }
  // The card is there, with its price, and its only button is a disabled "Opens soon".
  await expect(page.getByText("Account Pass").first()).toBeVisible();
  await expect(page.getByText("$329", { exact: true }).first()).toBeVisible();
  await expect(page.getByRole("button", { name: "Opens soon" }).first()).toBeDisabled();
  await expect(page.getByRole("link", { name: "Get the Account Pass" })).toHaveCount(0);
  // Nothing else on the page can buy it: the picker beside the pay button has only the Appeal Pass.
  await expect(page.getByText("Which Pass?")).toHaveCount(0);
  await expect(page.getByText("What to buy")).toHaveCount(0);
  await expect(page.getByTestId("founding-note")).toHaveCount(0);
  const res = await request.get("/api/founding");
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ spotsLeft: null, total: null });
  await page.goto("/partners");
  await expect(page.getByText("The same 30 percent applies to the Account Pass")).toHaveCount(0);
});

test("pricing shows all three audiences and marks the sellers' page", async ({ page }) => {
  await page.goto("/pricing");
  const nav = audienceNav(page);
  await expect(nav.getByRole("link")).toHaveCount(3);
  await expect(nav.getByRole("link", { name: "Sellers", exact: true })).toHaveAttribute(
    "aria-current",
    "page",
  );
  await expect(nav.getByRole("link", { name: "Writers and VA teams", exact: true })).toBeVisible();
  await expect(nav.getByRole("link", { name: "Partners", exact: true })).toBeVisible();
});

test("pricing answers 'Can I ask a chatbot instead?' and dates the going rates", async ({
  page,
}) => {
  await page.goto("/pricing");
  // The question is the eyebrow; the heading answers it with the division of labour.
  await expect(page.getByText("Can I ask a chatbot instead?", { exact: true })).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: "A chatbot writes the letter. AppealDeck builds the case.",
      level: 2,
    }),
  ).toBeVisible();
  const table = page.getByRole("table").filter({ hasText: "A general chatbot" });
  await expect(table.getByRole("row")).toHaveCount(8); // heading row + seven jobs
  await expect(
    table.getByRole("rowheader", { name: "A warning when a new round adds nothing" }),
  ).toBeVisible();
  await expect(page.getByText("read on 24 October 2026")).toBeVisible();
  // It says plainly where the alternative is enough, and claims nothing about Amazon.
  await expect(
    page
      .locator("#versus")
      .getByText("For a first read of a simple notice, a general chatbot can be enough."),
  ).toBeVisible();
  await expect(
    page.getByText("whether it answers what the notice asked, whoever wrote it"),
  ).toBeVisible();
  // The Pass sits in the same price strip as the alternatives, at the price the page charges.
  const versus = page.locator("#versus");
  await expect(versus.getByText("AppealDeck Appeal Pass")).toBeVisible();
  await expect(versus.getByText("$249 once", { exact: true })).toBeVisible();
});

test("the chatbot answer in the FAQ points at that comparison", async ({ page }) => {
  await page.goto("/faq");
  await page.getByText("Can I use ChatGPT or Claude instead?").click();
  const link = page.getByRole("link", { name: "See the comparison" });
  await expect(link).toHaveAttribute("href", "/pricing#versus");
});

test("the writers' page shows the professional prices as opening soon, with no way to buy them", async ({
  page,
}) => {
  test.skip(
    !!(
      process.env.NEXT_PUBLIC_PADDLE_PRICE_PACK_10 ||
      process.env.NEXT_PUBLIC_PADDLE_PRICE_PACK_30 ||
      process.env.NEXT_PUBLIC_PADDLE_PRICE_PRO_PLAN
    ),
    "this is the preview case; the switched-on case is more-ways-to-pay.spec.ts",
  );
  await page.goto("/for-professionals");
  await expect(
    page.getByRole("heading", { name: "Check the proof on every client case.", level: 1 }),
  ).toBeVisible();
  if (process.env.NEXT_PUBLIC_PLANS_PREVIEW === "off") {
    await expect(
      page.getByText("Professional pricing is being shaped with the first writers."),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Opens soon" })).toHaveCount(0);
    return;
  }
  await expect(
    page.getByText("Professional pricing is being shaped with the first writers."),
  ).toHaveCount(0);
  // The prices are cards under the hero, as on the sellers page; credits and the Pro plan are previewed.
  const cards = page.getByRole("list", { name: "Prices for writers and VA teams" });
  await expect(cards.getByText("For every client case")).toBeVisible();
  await expect(cards.getByRole("heading", { name: "With a free account" })).toBeVisible();
  await expect(cards.getByText("10 credits for $390 ($39 a case)")).toBeVisible();
  await expect(cards.getByText("$349", { exact: true })).toBeVisible();
  await expect(cards.getByRole("button", { name: "Opens soon" })).toHaveCount(2);
  await expect(cards.getByRole("button", { name: "Opens soon" }).first()).toBeDisabled();
  await expect(page.getByText("Not on sale yet").first()).toBeVisible();
  await expect(page.getByRole("button", { name: /Buy 10 credits|Start the Pro plan/ })).toHaveCount(
    0,
  );
  await expect(page.getByRole("link", { name: "Ask to be verified" })).toBeVisible();
  await expect(page.getByText("Hand it to a colleague with an export")).toBeVisible();
  const write = page.getByRole("link", { name: "Write to us about how you work" }).first();
  await expect(write).toHaveAttribute("href", /^mailto:support@appealdeck\.com\?subject=/);
  await expect(page.getByRole("link", { name: "See the partner program" })).toHaveAttribute(
    "href",
    "/partners",
  );
  await expect(
    audienceNav(page).getByRole("link", { name: "Writers and VA teams", exact: true }),
  ).toHaveAttribute("aria-current", "page");
});

test("the partner page states the commission, the discount, the payout and the rules", async ({
  page,
}) => {
  await page.goto("/partners");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("checks the proof");
  await expect(page.getByText("a sale earns $67.20")).toBeVisible();
  await expect(page.getByText("Codes are issued individually.")).toBeVisible();
  await expect(page.getByText("in writing that you earn it before they buy")).toBeVisible();
  await expect(page.getByText(/I earn a commission if you buy/)).toBeVisible();
  await expect(page.getByRole("link", { name: "Write to us to apply" }).first()).toHaveAttribute(
    "href",
    /^mailto:support@appealdeck\.com\?subject=Partner/,
  );
});

test("Dex has a line for each new page", async ({ page }) => {
  await page.goto("/partners");
  await expect(page.getByText("Know a seller who needs help?")).toBeVisible();
  await page.goto("/for-professionals");
  await expect(page.getByText("Here is what writers can use.")).toBeVisible();
});

test("a visitor who picks 'writers' is pointed to their page from the sellers' pricing", async ({
  page,
}) => {
  await page.goto("/pricing");
  await expect(page.getByText("You said you write appeals for clients.")).toHaveCount(0);
  await audienceNav(page).getByRole("link", { name: "Writers and VA teams", exact: true }).click();
  await expect(page).toHaveURL(/\/for-professionals$/);
  expect(await stored(page, "appealdeck.role")).toBe("pro");
  await page.goto("/pricing");
  await expect(page.getByText("You said you write appeals for clients.")).toBeVisible();
  await expect(
    page.getByRole("link", { name: "See what is here for writers and VA teams" }),
  ).toHaveAttribute("href", "/for-professionals");
  // choosing sellers again removes the nudge: a seller never sees it
  await audienceNav(page).getByRole("link", { name: "Sellers", exact: true }).click();
  await expect(page.getByText("You said you write appeals for clients.")).toHaveCount(0);
});

test("sign-up asks what brings you here, stores it on the device, and can be skipped", async ({
  page,
}) => {
  await page.goto("/signup");
  const group = page.getByRole("group", { name: "What brings you here? (optional)" });
  await expect(group).toBeVisible();
  for (const label of [
    "My Amazon account has a problem",
    "I write appeals for clients or run a VA team",
    "I send sellers to good tools",
    "Just looking",
  ])
    await expect(group.getByRole("radio", { name: label })).toBeVisible();
  // nothing is chosen by default, and the form does not need an answer
  await expect(group.getByRole("radio", { checked: true })).toHaveCount(0);
  await group.getByRole("radio", { name: "I send sellers to good tools" }).check();
  expect(await stored(page, "appealdeck.role")).toBe("partner");
  await page.goto("/pricing");
  await expect(page.getByText("You said you send sellers to good tools.")).toBeVisible();
});

test("sign-up in the middle of a case is not asked the question", async ({ page }) => {
  await page.goto("/signup?next=/case");
  await expect(page.getByRole("group", { name: "What brings you here? (optional)" })).toHaveCount(
    0,
  );
});

test("?role= on the sign-up link pre-selects the question", async ({ page }) => {
  await page.goto("/signup?role=pro");
  const group = page.getByRole("group", { name: "What brings you here? (optional)" });
  await expect(
    group.getByRole("radio", { name: "I write appeals for clients or run a VA team" }),
  ).toBeChecked();
});

test.describe("partner codes", () => {
  test("a link with a code keeps it on the device and shows it by the pay button", async ({
    page,
  }) => {
    await page.goto("/pricing?ref=anna-2026");
    await expect
      .poll(async () => stored(page, "appealdeck.partnerCode"))
      .toContain('"code":"ANNA-2026"');
    await expect(
      page.getByRole("status").filter({ hasText: "Partner code ANNA-2026" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Remove the code" }).click();
    await expect(page.getByText("Partner code ANNA-2026")).toHaveCount(0);
    expect(await stored(page, "appealdeck.partnerCode")).toBeNull();
  });

  test("a code in a link that is not a code is ignored", async ({ page }) => {
    await page.goto("/pricing?ref=%3Cscript%3E");
    await page.waitForLoadState("networkidle");
    expect(await stored(page, "appealdeck.partnerCode")).toBeNull();
    await expect(page.getByText("Partner code")).toHaveCount(0);
  });

  test("the first partner a seller meets keeps the sale", async ({ page }) => {
    await page.goto("/?ref=first");
    await expect.poll(async () => stored(page, "appealdeck.partnerCode")).toContain("FIRST");
    await page.goto("/?ref=second");
    await page.waitForLoadState("networkidle");
    expect(await stored(page, "appealdeck.partnerCode")).toContain("FIRST");
    expect(await stored(page, "appealdeck.partnerCode")).not.toContain("SECOND");
  });
});

test("sellers, writers and partners all open on the same pricing layout, with their prices as cards", async ({
  page,
}) => {
  for (const [path, list] of [
    ["/pricing", "Plans for sellers"],
    ["/for-professionals", "Prices for writers and VA teams"],
    ["/partners", "What a partner earns"],
  ] as const) {
    await page.goto(path);
    // one h1, the audience switch with the current page marked, then the cards
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(audienceNav(page).getByRole("link")).toHaveCount(3);
    await expect(audienceNav(page).locator("[aria-current=page]")).toHaveCount(1);
    const cards = page.getByRole("list", { name: list });
    await expect(cards).toBeVisible();
    expect(await cards.locator("> li").count()).toBeGreaterThanOrEqual(2);
    // the first card sits on the hero's lower edge: the cards overlap it, as on the sellers' page
    const hero = await page.locator("section.stage").first().boundingBox();
    const first = await cards.locator("> li").first().boundingBox();
    expect(first!.y).toBeLessThan(hero!.y + hero!.height);
  }
});

test("the partner cards show what a partner earns, worked out from the prices", async ({
  page,
}) => {
  test.skip(
    !!process.env.NEXT_PUBLIC_PADDLE_PRICE_ACCOUNT_PASS,
    "this is the preview case; the switched-on case shows no Opens soon",
  );
  await page.goto("/partners");
  const cards = page.getByRole("list", { name: "What a partner earns" });
  await expect(cards.getByText("$67.20")).toBeVisible();
  await expect(
    cards.getByText("The seller pays $224.00: $249 less your $25 discount"),
  ).toBeVisible();
  if (process.env.NEXT_PUBLIC_PLANS_PREVIEW === "off") {
    await expect(cards.getByText("$91.20")).toHaveCount(0);
    return;
  }
  await expect(cards.getByText("$91.20")).toBeVisible();
  await expect(cards.getByRole("button", { name: "Opens soon" })).toBeDisabled();
  await expect(cards.getByRole("link", { name: /Write to us to apply/ })).toHaveAttribute(
    "href",
    /^mailto:/,
  );
  await cards.getByRole("link", { name: "Read the rules" }).first().click();
  await expect(page.locator("#partners-rules")).toBeInViewport();
});
