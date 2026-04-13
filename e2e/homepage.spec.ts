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

  test('Explore All Demos button scrolls to tools section', async ({ page }) => {
    await page.getByRole('link', { name: /Explore All Demos/i }).first().click();
    await expect(page.locator('#tools')).toBeInViewport({ timeout: 10000 });
  });

  test('all 3 demo group headers are visible', async ({ page }) => {
    // DOM text is title-cased — CSS `uppercase` is visual-only and not matched by Playwright
    // Use exact:true to match only the header span, not paragraphs containing the phrase
    await expect(page.getByText('Core AI Infrastructure', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Agentic Systems', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('AI Applications', { exact: true }).first()).toBeVisible();
  });

  test('all 10 demo cards are present', async ({ page }) => {
    // Use first() because card titles may appear in multiple elements (heading + aria-label etc.)
    await expect(page.getByText('RAG Pipeline').first()).toBeVisible();
    await expect(page.getByText('LLM Router').first()).toBeVisible();
    await expect(page.getByText('Vector Search').first()).toBeVisible();
    await expect(page.getByText('Multi-Agent System').first()).toBeVisible();
    await expect(page.getByText('MCP Tool Demo').first()).toBeVisible();
    await expect(page.getByText('AI Portfolio Assistant').first()).toBeVisible();
    await expect(page.getByText('Resume Generator').first()).toBeVisible();
    await expect(page.getByText('Multimodal Assistant').first()).toBeVisible();
    await expect(page.getByText('Model Quantization').first()).toBeVisible();
    await expect(page.getByText('AI Evaluation Showcase').first()).toBeVisible();
  });

  test('Desktop badge appears on exactly 3 cards', async ({ page }) => {
    const desktopBadges = page.getByText('Desktop');
    await expect(desktopBadges).toHaveCount(3);
  });

  test('transformation framework section is visible', async ({ page }) => {
    await expect(page.getByText('Delivering AI impact requires more than models').first()).toBeVisible();
    await expect(page.getByText('Platform').first()).toBeVisible();
    await expect(page.getByText('Workflow').first()).toBeVisible();
    await expect(page.getByText('Organization').first()).toBeVisible();
  });

  test('architecture diagram shows 6 layers', async ({ page }) => {
    await expect(page.getByText('How I Build Enterprise AI Systems').first()).toBeVisible();
    await expect(page.getByText('Users & Channels').first()).toBeVisible();
    await expect(page.getByText('Business Outcomes').first()).toBeVisible();
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
  });

  test('recruiter strip is visible with all 3 buttons', async ({ page }) => {
    await expect(page.getByText(/For Recruiters/i)).toBeVisible();
    await expect(page.getByRole('link', { name: /Download Resume/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Start a Conversation/i })).toBeVisible();
  });
});
