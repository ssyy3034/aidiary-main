import { test, expect } from "@playwright/test";
import { mockAuthApis, mockHomeApis } from "./fixtures";

test.describe("인증", () => {
  test("비로그인 시 /login으로 리다이렉트된다", async ({ page }) => {
    await page.goto("/");
    await expect(page).toHaveURL(/.*login/);
  });

  test("로그인 페이지에 브랜드 텍스트가 보인다", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("heading", { name: "산모일기" })).toBeVisible();
    await expect(
      page.getByText("소중한 순간을 기록하는 나만의 노트"),
    ).toBeVisible();
  });

  test("로그인 폼이 올바르게 렌더링된다", async ({ page }) => {
    await page.goto("/login");

    await expect(page.getByTestId("login-username")).toBeVisible();
    await expect(page.getByTestId("login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "시작하기" })).toBeVisible();
    await expect(page.getByText("회원가입")).toBeVisible();
  });

  test("올바른 자격증명으로 로그인하면 홈으로 이동한다", async ({ page }) => {
    await mockAuthApis(page);
    await mockHomeApis(page);

    await page.goto("/login");
    await page.getByTestId("login-username").fill("testuser");
    await page.getByTestId("login-password").fill("password123");
    await page.getByRole("button", { name: "시작하기" }).click();

    await expect(page).toHaveURL("/");
  });

  test("잘못된 자격증명으로 로그인하면 에러가 표시된다", async ({ page }) => {
    await mockAuthApis(page);

    await page.goto("/login");
    await page.getByTestId("login-username").fill("wronguser");
    await page.getByTestId("login-password").fill("wrongpassword");
    await page.getByRole("button", { name: "시작하기" }).click();

    // 로그인 페이지에 머물러야 함
    await expect(page).toHaveURL(/.*login/);
  });

  test("회원가입 링크 클릭 시 /register로 이동한다", async ({ page }) => {
    await page.goto("/login");
    await page.getByText("회원가입").click();

    await expect(page).toHaveURL(/.*register/);
  });

  test("보호된 경로에 비로그인 접근 시 /login으로 리다이렉트된다", async ({
    page,
  }) => {
    const protectedRoutes = ["/diary", "/character", "/health", "/profile"];

    for (const route of protectedRoutes) {
      await page.goto(route);
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
