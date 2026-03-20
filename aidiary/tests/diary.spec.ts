import { test, expect } from "@playwright/test";
import { loginAndGoHome, mockDiaryApis, MOCK_DIARY_ENTRY } from "./fixtures";

test.describe("일기 기능", () => {
  test.beforeEach(async ({ page }) => {
    await mockDiaryApis(page);
    await loginAndGoHome(page);

    // 하단 탭으로 일기 페이지 이동 (exact로 홈의 "일기 쓰기" 버튼과 구분)
    await page.getByRole("button", { name: "일기", exact: true }).click();
    await expect(page).toHaveURL(/.*diary/);
  });

  test("일기 목록이 표시된다", async ({ page }) => {
    await expect(page.getByTestId("diary-card").first()).toBeVisible();
    await expect(
      page.getByText(MOCK_DIARY_ENTRY.content).first(),
    ).toBeVisible();
  });

  test("일기 작성 폼이 보인다", async ({ page }) => {
    await expect(page.getByTestId("diary-textarea")).toBeVisible();
    await expect(page.getByTestId("submit-button")).toBeVisible();
  });

  test("빈 내용으로는 제출 버튼이 비활성화된다", async ({ page }) => {
    await expect(page.getByTestId("submit-button")).toBeDisabled();
  });

  test("일기를 작성하면 목록에 추가된다", async ({ page }) => {
    const content = "테스트 일기 내용입니다. 오늘은 좋은 하루였어요.";

    await page.getByTestId("diary-textarea").fill(content);
    await expect(page.getByTestId("submit-button")).toBeEnabled();
    await page.getByTestId("submit-button").click();

    // 새 일기가 목록에 나타나는지 확인
    await expect(page.getByText(content).first()).toBeVisible();
  });

  test("글자 수 카운터가 동작한다", async ({ page }) => {
    await page.getByTestId("diary-textarea").fill("안녕하세요");
    await expect(page.getByTestId("char-counter")).toContainText("5/500");
  });

  test("일기 카드에 감정 뱃지가 표시된다", async ({ page }) => {
    await expect(page.getByTestId("emotion-badge").first()).toBeVisible();
  });

  test("일기 카드 메뉴를 열면 수정/삭제 버튼이 보인다", async ({ page }) => {
    await page.getByRole("button", { name: "메뉴" }).first().click();
    await expect(page.getByTestId("edit-button").first()).toBeVisible();
    await expect(page.getByTestId("delete-button").first()).toBeVisible();
  });
});
