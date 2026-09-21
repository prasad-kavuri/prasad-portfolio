import { Card } from '@/components/ui/card';
import type { UiNode, UiSpec } from '@/lib/generativeUiCatalog';

// Fixed switch over the catalog's component types. This is the "safe
// rendering" half of the pattern: the renderer has no generic/dynamic path
// (no dangerouslySetInnerHTML, no dynamic component lookup by string) — every
// branch is a real, statically-known React component. A node whose `type`
// isn't one of these four never reaches this component, because the API
// route already rejected it via `isUiSpec`.

function StatTile({ node }: { node: Extract<UiNode, { type: 'stat-tile' }> }) {
  return (
    <Card className="p-4">
      <p className="text-xs uppercase tracking-wide text-muted-foreground">{node.label}</p>
      <p className="mt-1 text-2xl font-bold" style={{ color: 'var(--accent-brand)' }}>{node.value}</p>
      {node.caption && <p className="mt-1 text-sm text-muted-foreground">{node.caption}</p>}
    </Card>
  );
}

function ComparisonTable({ node }: { node: Extract<UiNode, { type: 'comparison-table' }> }) {
  return (
    <Card className="overflow-hidden p-0">
      <div className="border-b bg-muted/40 px-4 py-2 text-sm font-semibold">{node.title}</div>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left text-muted-foreground">
            <th className="px-4 py-2 font-medium"> </th>
            <th className="px-4 py-2 font-medium">{node.leftHeader}</th>
            <th className="px-4 py-2 font-medium">{node.rightHeader}</th>
          </tr>
        </thead>
        <tbody>
          {node.rows.map((row, i) => (
            <tr key={`${row.label}-${i}`} className="border-b last:border-0">
              <td className="px-4 py-2 font-medium text-muted-foreground">{row.label}</td>
              <td className="px-4 py-2">{row.left}</td>
              <td className="px-4 py-2">{row.right}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </Card>
  );
}

function Timeline({ node }: { node: Extract<UiNode, { type: 'timeline' }> }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold">{node.title}</p>
      <ol className="mt-3 space-y-3 border-l pl-4">
        {node.entries.map((entry, i) => (
          <li key={`${entry.period}-${i}`}>
            <p className="text-xs font-medium text-muted-foreground">{entry.period}</p>
            <p className="text-sm font-semibold">{entry.title}</p>
            <p className="text-sm text-muted-foreground">{entry.detail}</p>
          </li>
        ))}
      </ol>
    </Card>
  );
}

function SkillList({ node }: { node: Extract<UiNode, { type: 'skill-list' }> }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold">{node.title}</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {node.skills.map((skill, i) => (
          <span
            key={`${skill}-${i}`}
            className="rounded-full border px-3 py-1 text-xs text-muted-foreground"
          >
            {skill}
          </span>
        ))}
      </div>
    </Card>
  );
}

function renderNode(node: UiNode, key: number) {
  switch (node.type) {
    case 'stat-tile':
      return <StatTile key={key} node={node} />;
    case 'comparison-table':
      return <ComparisonTable key={key} node={node} />;
    case 'timeline':
      return <Timeline key={key} node={node} />;
    case 'skill-list':
      return <SkillList key={key} node={node} />;
  }
}

export function GenerativeUIRenderer({ spec }: { spec: UiSpec }) {
  return (
    <div>
      <p className="text-sm text-muted-foreground">{spec.summary}</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {spec.nodes.map((node, i) => renderNode(node, i))}
      </div>
    </div>
  );
}
