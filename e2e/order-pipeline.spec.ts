import { expect, test } from "@playwright/test";

test.describe("order pipeline (dev mode)", () => {
  test("demo → POS → admin happy path", async ({ page }) => {
    await page.goto("/demo");

    await page.getByRole("button", { name: /Finalize Sample Layout/i }).click();
    await expect(page.getByText("Order Locked")).toBeVisible();

    const orderHeading = page.locator("h1, p").filter({ hasText: /^#\w+-\d+/ });
    await expect(orderHeading.first()).toBeVisible();
    const orderText = await orderHeading.first().textContent();
    const orderCode = orderText?.replace("#", "").trim();
    expect(orderCode).toBeTruthy();

    await page.goto("/pos");
    await expect(page.getByText(`#${orderCode}`).first()).toBeVisible({
      timeout: 15_000,
    });

    await page
      .getByRole("button", { name: /Mark Paid & Send to Studio/i })
      .first()
      .click();

    await expect(page.getByText("Waiting for orders")).toBeVisible({
      timeout: 10_000,
    });

    await page.goto("/admin");
    await expect(page.getByText(`#${orderCode}`).first()).toBeVisible({
      timeout: 10_000,
    });

    await page.getByRole("button", { name: /Mark Assembly Complete/i }).first().click();

    await expect(page.getByText("No orders in studio yet")).toBeVisible({
      timeout: 10_000,
    });
  });
});
