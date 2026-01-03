import { test, expect } from "@playwright/test";

test.describe("Vault Lifecycle", () => {
  // Increase timeout for crypto operations
  test.setTimeout(180000);

  test("should create a standard vault and unlock it", async ({ page }) => {
    // 1. Navigate to create page
    await page.goto("/create");

    // 2. Fill in hidden content and password
    await page
      .getByPlaceholder("Enter your real secret content...")
      .fill("My Secret Data");
    await page
      .getByPlaceholder("Enter a strong password...")
      .fill("StrongPass123!");

    // 3. Create Vault
    // Force click because the button might be animating or have an overlay appearing
    await page
      .getByRole("button", { name: "Create Vault" })
      .click({ force: true });

    // 4. Wait for completion
    await expect(page.getByText("✓ Vault Created!")).toBeVisible({
      timeout: 60000,
    });

    // 5. Get Vault URL
    const vaultUrlLoc = page.locator("code").first();
    const vaultUrl = await vaultUrlLoc.innerText();
    expect(vaultUrl).toContain("/vault#");

    // 6. Navigate to Vault URL
    await page.goto(vaultUrl);
    
    // Wait for IPFS connection (10s for network setup)
    await page.waitForTimeout(10000);

    // 7. Unlock
    await page
      .getByPlaceholder("Enter password to unlock...")
      .fill("StrongPass123!");
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Unlock" }).click({ force: true });

    // Wait for unlock to complete (check for either success or error)
    await page.waitForTimeout(5000);

    // Check if there's an error
    const errorText = await page
      .locator("div")
      .filter({ hasText: /Failed|timeout|error/i })
      .textContent()
      .catch(() => null);
    if (errorText) {
      throw new Error(`Unlock failed: ${errorText}`);
    }

    // 8. Verify Hidden Content
    await expect(page.getByText("✓ Hidden Layer")).toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByText("My Secret Data")).toBeVisible();
  });

  test("should create a duress vault and verify both layers", async ({
    page,
  }) => {
    // 1. Navigate to create page
    await page.goto("/create");

    // 2. Fill in details
    await page
      .getByPlaceholder("Innocent content shown under duress...")
      .fill("Decoy Data");
    await page
      .getByPlaceholder("Enter your real secret content...")
      .fill("Hidden Data");

    await page
      .getByPlaceholder("Required if using decoy content...")
      .fill("DuressPass123!");
    await page
      .getByPlaceholder("Enter a strong password...")
      .fill("StrongPass123!");

    // 3. Create Vault
    await page
      .getByRole("button", { name: "Create Vault" })
      .click({ force: true });
    await expect(page.getByText("✓ Vault Created!")).toBeVisible({
      timeout: 60000,
    });

    // 4. Get URL
    const vaultUrl = await page.locator("code").first().innerText();

    // 5. Verify Decoy Access
    await page.goto(vaultUrl);
    
    // Wait for IPFS connection
    await page.waitForTimeout(10000);
    
    await page
      .getByPlaceholder("Enter password to unlock...")
      .fill("DuressPass123!");
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Unlock" }).click({ force: true });

    await expect(page.getByText("⚠️ Decoy Layer")).toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByText("Decoy Data")).toBeVisible();

    // 6. Lock and Verify Hidden Access
    await page.getByRole("button", { name: "Lock Vault" }).click();
    await page
      .getByPlaceholder("Enter password to unlock...")
      .fill("StrongPass123!");
    await page.waitForTimeout(1000);
    await page.getByRole("button", { name: "Unlock" }).click({ force: true });

    await expect(page.getByText("✓ Hidden Layer")).toBeVisible({
      timeout: 60000,
    });
    await expect(page.getByText("Hidden Data")).toBeVisible();
  });
});
