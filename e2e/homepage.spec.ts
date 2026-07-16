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

  test('AI Platform Demos CTA navigates to agent marketplace', async ({ page }) => {
    await page.getByRole('link', { name: /Explore AI Platform Demos/i }).click();
    await expect(page).toHaveURL(/\/agent-marketplace\/?$/);
    await expect(page.getByRole('heading', { name: /16 Production AI Agents/i })).toBeVisible();
  });

  test('all 3 demo group headers are visible', async ({ page }) => {
    // DOM text is title-cased — CSS `uppercase` is visual-only and not matched by Playwright
    // Use exact:true to match only the header span, not paragraphs containing the phrase
    await expect(page.getByText('Core AI Infrastructure', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('Agentic Systems', { exact: true }).first()).toBeVisible();
    await expect(page.getByText('AI Applications', { exact: true }).first()).toBeVisible();
  });

  test('all 16 demo cards are present', async ({ page }) => {
    // Use first() because card titles may appear in multiple elements (heading + aria-label etc.)
    await expect(page.getByText('RAG Pipeline').first()).toBeVisible();
    await expect(page.getByText('LLM Router').first()).toBeVisible();
    await expect(page.getByText('Vector Search').first()).toBeVisible();
    await expect(page.getByText('Multi-Agent System').first()).toBeVisible();
    await expect(page.getByText('MCP Tool Demo').first()).toBeVisible();
    await expect(page.getByText('Agent Auth Demo').first()).toBeVisible();
    await expect(page.getByText('Enterprise Control Plane').first()).toBeVisible();
    await expect(page.getByText('AI Portfolio Assistant').first()).toBeVisible();
    await expect(page.getByText('AI Hiring Intelligence').first()).toBeVisible();
    await expect(page.getByText('Multimodal Assistant').first()).toBeVisible();
    await expect(page.getByText('Model Quantization').first()).toBeVisible();
    await expect(page.getByText('AI Evaluation Showcase').first()).toBeVisible();
    await expect(page.getByText('Native Browser AI Skill').first()).toBeVisible();
    await expect(page.getByText('Real-Time Spatial AI + World Modeling Engine').first()).toBeVisible();
    await expect(page.getByText('Edge Agent + Cloud Agent Collaboration').first()).toBeVisible();
    await expect(page.getByText('STORM Research Agent').first()).toBeVisible();
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

  test('architecture diagram shows the platform execution flow', async ({ page }) => {
    const architectureSection = page.locator('#ai-architecture');
    await architectureSection.scrollIntoViewIfNeeded();
    await expect(architectureSection.getByText('How a Request Moves Through the Platform')).toBeVisible();
    await expect(architectureSection.getByText('User Intent', { exact: true })).toBeVisible();
    await expect(architectureSection.getByText('Business Outcome', { exact: true })).toBeVisible();
  });

  test('case studies section shows all 3 companies', async ({ page }) => {
    const caseStudies = page.locator('#case-studies');
    await expect(caseStudies.getByText('Where Strategy Met Execution')).toBeVisible();
    await expect(caseStudies.getByText('Krutrim').first()).toBeVisible();
    await expect(caseStudies.getByText('Ola').first()).toBeVisible();
    await expect(caseStudies.getByText('HERE Technologies').first()).toBeVisible();
  });

  test('perspectives section shows 3 articles', async ({ page }) => {
    // Use heading role to disambiguate from other elements containing this phrase
    await expect(page.getByRole('heading', { name: 'How I Think About AI' })).toBeVisible();
    await expect(page.getByText(/Enterprise AI Initiatives Stall/i).first()).toBeVisible();
    await expect(page.getByText(/Agentic AI Changes/i).first()).toBeVisible();
    await expect(page.getByText(/Managing Tradeoffs/i).first()).toBeVisible();
  });

  test('contact section shows AI strategy conversation CTA', async ({ page }) => {
    const contact = page.locator('#contact');
    await expect(contact.getByText(/Let's Talk AI Strategy/i)).toBeVisible();
    await expect(contact.getByText(/building an AI platform/i)).toBeVisible();
    await expect(contact.getByRole('link', { name: /Connect on LinkedIn/i }).first()).toBeVisible();
  });

  test('recruiter strip is visible with all 3 buttons', async ({ page }) => {
    const recruiterStrip = page.getByText('For Recruiters and Hiring Managers', { exact: true }).locator('../..');
    await expect(recruiterStrip).toBeVisible();
    await expect(recruiterStrip.getByRole('link', { name: /View LinkedIn/i })).toBeVisible();
    await expect(recruiterStrip.getByRole('link', { name: /Start a Conversation/i })).toBeVisible();
    await expect(recruiterStrip.getByRole('link', { name: /Book a Call/i })).toBeVisible();
  });
});
