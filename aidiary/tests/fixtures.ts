import { expect, type Page } from "@playwright/test";

/**
 * 공통 API 모킹 헬퍼
 * 백엔드 없이 프론트엔드 E2E 테스트를 실행하기 위한 mock 데이터
 */

export const MOCK_USER = {
  id: 1,
  username: "testuser",
  email: "test@example.com",
  phone: "01012345678",
  child: { id: 1, childName: "튼튼이", childBirthday: "2026-06-01" },
};

export const MOCK_CHILD = {
  id: 1,
  childName: "튼튼이",
  childBirthday: "2026-06-01",
  characterImage: null,
};

export const MOCK_DIARY_ENTRY = {
  id: 1,
  title: "일기",
  content: "오늘 아기가 많이 움직였어요. 건강하게 자라고 있는 것 같아 기뻐요.",
  emotion: "happy",
  aiResponse: null,
  fetalArtUrl: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

/**
 * 로그인 관련 API를 모킹한다
 */
export async function mockAuthApis(page: Page) {
  await page.route("**/api/auth/login", async (route) => {
    const body = route.request().postDataJSON();
    if (body.username === "testuser" && body.password === "password123") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({
          token: "mock-jwt-token",
          ...MOCK_USER,
        }),
      });
    } else {
      await route.fulfill({
        status: 401,
        contentType: "application/json",
        body: JSON.stringify({ message: "Invalid credentials" }),
      });
    }
  });

  await page.route("**/api/user/info", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_USER),
    });
  });

  await page.route("**/api/child/me", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(MOCK_CHILD),
    });
  });
}

/**
 * 홈 화면에 필요한 API를 모킹한다.
 * axios response.data = body이므로 래핑 없이 직접 데이터를 반환한다.
 */
export async function mockHomeApis(page: Page) {
  await page.route("**/api/diary-ai/daily-question", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        question: "오늘 아기에게 어떤 이야기를 해주고 싶나요?",
      }),
    });
  });

  // diary getAll: response.data = { content: [...], totalPages, number }
  await page.route("**/api/diary?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: [MOCK_DIARY_ENTRY],
        totalPages: 1,
        number: 0,
      }),
    });
  });

  // character 관련
  await page.route("**/api/character/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(null),
    });
  });
}

/**
 * 일기 관련 API를 모킹한다
 */
export async function mockDiaryApis(page: Page) {
  let diaryEntries = [MOCK_DIARY_ENTRY];

  await page.route("**/api/diary-ai/daily-question", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        question: "오늘 아기에게 어떤 이야기를 해주고 싶나요?",
      }),
    });
  });

  // POST /api/diary (exact, no query string)
  await page.route("**/api/diary", async (route) => {
    if (route.request().method() === "POST") {
      const body = route.request().postDataJSON();
      const newEntry = {
        id: diaryEntries.length + 1,
        ...body,
        aiResponse: null,
        fetalArtUrl: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      diaryEntries = [newEntry, ...diaryEntries];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(newEntry),
      });
    } else {
      await route.continue();
    }
  });

  // GET /api/diary?page=0&size=4
  await page.route("**/api/diary?*", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        content: diaryEntries,
        totalPages: 1,
        number: 0,
      }),
    });
  });
}

/**
 * 건강 페이지 API를 모킹한다
 */
export async function mockHealthApis(page: Page) {
  await page.route("**/api/pregnancy/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({
        weekNumber: 20,
        trimester: 2,
        babySize: "바나나",
        babySizeCm: "25cm",
        babyWeight: "300g",
        developmentSummary: "아기가 활발하게 움직이기 시작해요.",
        momTips: "균형 잡힌 식단을 유지하세요.",
        warnings: "과도한 운동은 피하세요.",
      }),
    });
  });

  await page.route("**/api/fetal-movement/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([]),
    });
  });

  await page.route("**/api/health/**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify(null),
    });
  });
}

/**
 * 로그인을 수행하고 홈 화면까지 이동한다.
 */
export async function loginAndGoHome(page: Page) {
  await mockAuthApis(page);
  await mockHomeApis(page);

  await page.goto("/login");
  await page.getByTestId("login-username").fill("testuser");
  await page.getByTestId("login-password").fill("password123");
  await page.getByRole("button", { name: "시작하기" }).click();

  await expect(page).toHaveURL("/");
}
