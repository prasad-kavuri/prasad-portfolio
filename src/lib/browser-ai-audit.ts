export type BrowserAuditCheckResult = {
  key: string;
  label: string;
  ok: boolean;
  detail: string;
};

export function runBrowserAuditChecks(input: string): BrowserAuditCheckResult[] {
  const hasMain = /<main[\s>]/i.test(input);
  const hasNav = /<nav[\s>]/i.test(input);
  const imgWithoutAlt = /<img\b(?![^>]*\balt=)[^>]*>/i.test(input);
  const unlabeledButton = /<button\b[^>]*>\s*<\/button>/i.test(input);
  const hasTabIndex = /tabindex=/i.test(input);
  const hasAriaLabels = /aria-label=/i.test(input);

  return [
    {
      key: 'landmarks',
      label: 'Semantic landmarks',
      ok: hasMain || hasNav,
      detail: hasMain || hasNav ? 'Core landmarks detected.' : 'Add <main> or <nav> landmarks.',
    },
    {
      key: 'alt-text',
      label: 'Image accessibility',
      ok: !imgWithoutAlt,
      detail: imgWithoutAlt ? 'At least one image is missing alt text.' : 'Image alt coverage looks good.',
    },
    {
      key: 'controls',
      label: 'Interactive control labels',
      ok: !unlabeledButton,
      detail: unlabeledButton ? 'Found a button with no accessible label.' : 'Buttons have visible/accessible labels.',
    },
    {
      key: 'focus',
      label: 'Keyboard and agent readiness',
      ok: hasTabIndex || hasAriaLabels || hasMain,
      detail:
        hasTabIndex || hasAriaLabels || hasMain
          ? 'Structure supports keyboard and automation navigation.'
          : 'Add focus or ARIA metadata for resilient automation.',
    },
  ];
}
