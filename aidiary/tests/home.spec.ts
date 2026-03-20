import { test, expect } from "@playwright/test";
import { loginAndGoHome, MOCK_DIARY_ENTRY } from "./fixtures";

test.describe("홈 화면", () => {
  test.beforeEach(async ({ page }) => {
    await loginAndGoHome(page);
  });

  test("인사 영역에 아이 이름이 표시된다", async ({ page }) => {
    await expect(page.getByText("튼튼이의 하루")).toBeVisible();
  });

  test("오늘의 질문이 표시된다", async ({ page }) => {
    await expect(page.getByText("오늘의 질문")).toBeVisible();
    await expect(
      page.getByText("오늘 아기에게 어떤 이야기를 해주고 싶나요?"),
    ).toBeVisible();
  });

  test("일기 쓰기 버튼이 표시된다", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /일기 쓰기/ }),
    ).toBeVisible();
  });

  test("일기 쓰기 버튼 클릭 시 /diary로 이동한다", async ({ page }) => {
    await page.getByRole("button", { name: /일기 쓰기/ }).click();
    await expect(page).toHaveURL(/.*diary/);
  });

  test("최근 일기가 표시된다", async ({ page }) => {
    await expect(
      page.getByText(MOCK_DIARY_ENTRY.content).first(),
    ).toBeVisible();
  });
});
