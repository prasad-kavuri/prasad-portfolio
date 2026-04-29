import { test, expect } from '@playwright/test';

test.describe('Homepage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('loads in dark mode by default', async ({ page }) => {
    const html = page.locator('html');
    await expect(html).toHaveClass(/dark/);
  });

  test('displays Prasad Kavuri name in hero', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Prasad Kavuri' })).toBeVisible();
  });

  test('displays 4 differentiator bullets', async ({ page }) => {
    await expect(page.getByText(/production AI systems — not prototypes/i)).toBeVisible();
    await expect(page.getByText(/cost, latency, and scalability/i)).toBeVisible();
  });

  test('Browse All Demos CTA navigates to canonical demos index', async ({ page }) => {
    await page.getByRole('link', { name: /Browse All 14 Demos/i }).first().click();
    await expect(page).toHaveURL(/\/demos\/?$/);
    await expect(page.getByRole('heading', { name: /All Production Demos/i })).toBeVisible();
  });

  test('all 3 demo group headers are visible', async ({ page }) => {
    // DOM text is title-cased — CSS `uppercase` is visual-only and not matched by Playwright
    // Use exact:true to match only the header span, not paragraphs containing the phrase
    await expect(page.getByText('Core AI Infrastructure', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Agentic Systems', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('AI Applications', { exact: true }).first()).toBeVisible();
  });

  test('all 14 demo cards are present', async ({ page }) => {
    // Use first() because card titles may appear in multiple elements (heading + aria-label etc.)
    await expect(page.getByText('RAG Pipeline').first()).toBeVisible();
    await expect(page.getByText('LLM Router').first()).toBeVisible();
    await expect(page.getByText('Vector Search').first()).toBeVisible();
    await expect(page.getByText('Multi-Agent System').first()).toBeVisible();
    await expect(page.getByText('MCP Tool Demo').first()).toBeVisible();
    await expect(page.getByText('Enterprise Control Plane').first()).toBeVisible();
    await expect(page.getByText('AI Portfolio Assistant').first()).toBeVisible();
    await expect(page.getByText('Resume Generator').first()).toBeVisible();
    await expect(page.getByText('Multimodal Assistant').first()).toBeVisible();
    await expect(page.getByText('Model Quantization').first()).toBeVisible();
    await expect(page.getByText('AI Evaluation Showcase').first()).toBeVisible();
    await expect(page.getByText('Native Browser AI Skill').first()).toBeVisible();
    await expect(page.getByText('Real-Time Spatial AI + World Modeling Engine').first()).toBeVisible();
    await expect(page.getByText('Edge Agent + Cloud Agent Collaboration').first()).toBeVisible();
  });

  test('Desktop badge appears on exactly 4 cards', async ({ page }) => {
    const desktopBadges = page.getByText(/^Desktop$/);
    await expect(desktopBadges).toHaveCount(4);
  });

  test('transformation framework section is visible', async ({ page }) => {
    const transformationSection = page.locator('#transformation');
    await transformationSection.scrollIntoViewIfNeeded();
    await expect(transformationSection.getByText('Delivering AI impact requires more than models')).toBeVisible();
    await expect(transformationSection.getByRole('heading', { name: 'Platform' })).toBeVisible();
    await expect(transformationSection.getByRole('heading', { name: 'Workflow' })).toBeVisible();
    await expect(transformationSection.getByRole('heading', { name: 'Organization' })).toBeVisible();
  });

  test('architecture diagram shows 6 layers', async ({ page }) => {
    const architectureSection = page.locator('#architecture');
    await architectureSection.scrollIntoViewIfNeeded();
    await expect(architectureSection.getByText('How I Build Enterprise AI Systems')).toBeVisible();
    await expect(architectureSection.getByText('Users & Channels', { exact: true })).toBeVisible();
    await expect(architectureSection.getByText('Business Outcomes', { exact: true })).toBeVisible();
  });

  test('case studies section shows all 3 companies', async ({ page }) => {
    await expect(page.getByText('Where Strategy Met Execution').first()).toBeVisible();
    await expect(page.getByText('Krutrim').first()).toBeVisible();
    await expect(page.getByText('Ola').first()).toBeVisible();
    await expect(page.getByText('HERE Technologies').first()).toBeVisible();
  });

  test('perspectives section shows 3 articles', async ({ page }) => {
    // Use heading role to disambiguate from other elements containing this phrase
    await expect(page.getByRole('heading', { name: 'How I Think About AI' })).toBeVisible();
    await expect(page.getByText(/Enterprise AI Initiatives Stall/i).first()).toBeVisible();
    await expect(page.getByText(/Agentic AI Changes/i).first()).toBeVisible();
    await expect(page.getByText(/Managing Tradeoffs/i).first()).toBeVisible();
  });

  test('contact section shows role targeting', async ({ page }) => {
    await expect(page.getByText(/Open to VP \/ Head of AI Engineering/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Connect on LinkedIn/i }).first()).toBeVisible();
  });

  test('recruiter strip is visible with all 3 buttons', async ({ page }) => {
    await expect(page.getByText('For Recruiters and Hiring Managers', { exact: true })).toBeVisible();
    await expect(page.getByRole('link', { name: /Download Resume/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start a Conversation/i })).toBeVisible();
  });
});
