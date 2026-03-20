import { test, expect } from "@playwright/test";
import { loginAndGoHome, mockDiaryApis, mockHealthApis } from "./fixtures";

test.describe("하단 탭 네비게이션", () => {
  test.beforeEach(async ({ page }) => {
    await mockDiaryApis(page);
    await mockHealthApis(page);
    await loginAndGoHome(page);
  });

  test("홈 탭에서 일기 탭으로 이동한다", async ({ page }) => {
    await page.getByRole("button", { name: "일기", exact: true }).click();
    await expect(page).toHaveURL(/.*diary/);
  });

  test("건강 탭으로 이동한다", async ({ page }) => {
    await page.getByRole("button", { name: "건강" }).click();
    await expect(page).toHaveURL(/.*health/);
  });

  test("우리아이 탭으로 이동한다", async ({ page }) => {
    await page.getByRole("button", { name: "우리아이" }).click();
    await expect(page).toHaveURL(/.*character/);
  });

  test("마이 탭으로 이동한다", async ({ page }) => {
    await page.getByRole("button", { name: "마이" }).click();
    await expect(page).toHaveURL(/.*profile/);
  });

  test("탭 간 왕복 이동이 정상 동작한다", async ({ page }) => {
    await page.getByRole("button", { name: "일기", exact: true }).click();
    await expect(page).toHaveURL(/.*diary/);

    await page.getByRole("button", { name: "홈" }).click();
    await expect(page).toHaveURL("/");

    await page.getByRole("button", { name: "건강" }).click();
    await expect(page).toHaveURL(/.*health/);
  });
});
