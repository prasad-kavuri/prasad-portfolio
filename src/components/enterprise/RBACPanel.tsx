"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import type { TeamPermissions, CapabilityKey, ConnectorAction } from "./types";

const CAPABILITY_LABELS: Record<CapabilityKey, string> = {
  cowork:     "Cowork",
  code:       "Code Generation",
  rag:        "RAG / Knowledge",
  multimodel: "Multi-Model",
  connectors: "Connectors",
  skills:     "Skills",
};

const ROLE_COLORS: Record<string, string> = {
  engineering: "bg-blue-500/20 text-blue-700 border-blue-300",
  marketing:   "bg-purple-500/20 text-purple-700 border-purple-300",
  legal:       "bg-amber-500/20 text-amber-700 border-amber-300",
  finance:     "bg-green-500/20 text-green-700 border-green-300",
  operations:  "bg-orange-500/20 text-orange-700 border-orange-300",
};

function hasHighRiskPermissions(team: TeamPermissions): boolean {
  return Object.values(team.connectorPermissions).some(
    (actions) => actions.includes('write') && actions.includes('delete')
  );
}

interface ToastState {
  visible: boolean;
  message: string;
}

interface Props {
  teams: TeamPermissions[];
}

export function RBACPanel({ teams }: Props) {
  const [selectedId, setSelectedId] = useState<string>(teams[0]?.teamId ?? '');
  const [localCaps, setLocalCaps] = useState<Record<string, Record<CapabilityKey, boolean>>>(
    () => Object.fromEntries(teams.map(t => [t.teamId, { ...t.capabilities }]))
  );
  const [toast, setToast] = useState<ToastState>({ visible: false, message: '' });

  const selected = teams.find(t => t.teamId === selectedId);

  function showToast(message: string) {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: '' }), 2500);
  }

  function toggleCapability(teamId: string, cap: CapabilityKey) {
    setLocalCaps(prev => ({
      ...prev,
      [teamId]: { ...prev[teamId], [cap]: !prev[teamId][cap] },
    }));
    showToast('Change saved (simulated)');
  }

  if (!selected) return null;

  const caps = localCaps[selected.teamId] ?? selected.capabilities;
  const connectors = Object.entries(selected.connectorPermissions);

  return (
    <div className="relative">
      {/* Toast */}
      {toast.visible && (
        <div className="fixed top-6 right-6 z-50 bg-green-600 text-white text-sm px-4 py-2 rounded shadow-lg">
          {toast.message}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        {/* Team list */}
        <div className="md:w-56 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Teams</p>
          <div className="space-y-2">
            {teams.map(team => (
              <button
                key={team.teamId}
                onClick={() => setSelectedId(team.teamId)}
                className={`w-full text-left rounded-lg border px-3 py-3 transition-colors ${
                  selectedId === team.teamId
                    ? 'border-blue-500 bg-blue-500/10'
                    : 'border-border bg-card hover:bg-muted/50'
                }`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-medium text-sm">{team.teamName}</span>
                  {hasHighRiskPermissions(team) && (
                    <span title="High-risk permissions enabled" className="text-amber-500 text-xs">⚠</span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1">
                  <Badge className={`text-xs border ${ROLE_COLORS[team.role] ?? ''}`}>
                    {team.role}
                  </Badge>
                  {team.scimProvisioned && (
                    <Badge variant="outline" className="text-xs border-teal-400 text-teal-600">SCIM</Badge>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{team.memberCount} members</p>
              </button>
            ))}
          </div>
        </div>

        {/* Permission grid */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-4">
            <h3 className="text-base font-semibold">{selected.teamName}</h3>
            <Badge className={`text-xs border ${ROLE_COLORS[selected.role] ?? ''}`}>{selected.role}</Badge>
            {selected.scimProvisioned && (
              <Badge variant="outline" className="text-xs border-teal-400 text-teal-600">SCIM</Badge>
            )}
          </div>

          {/* SCIM banner */}
          {selected.scimProvisioned && (
            <div className="mb-4 bg-teal-500/10 border border-teal-400/30 rounded-lg px-4 py-2 text-xs text-teal-700">
              Provisioned via SCIM from identity provider. Manual overrides apply on top.
            </div>
          )}

          {/* Capabilities */}
          <Card className="p-4 mb-4 bg-card border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Capabilities</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {(Object.keys(CAPABILITY_LABELS) as CapabilityKey[]).map(cap => (
                <div key={cap} className="flex items-center justify-between gap-2">
                  <span className="text-sm text-muted-foreground">{CAPABILITY_LABELS[cap]}</span>
                  <button
                    role="switch"
                    aria-checked={caps[cap]}
                    aria-label={`Toggle ${CAPABILITY_LABELS[cap]} for ${selected.teamName}`}
                    onClick={() => toggleCapability(selected.teamId, cap)}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 ${
                      caps[cap] ? 'bg-blue-600' : 'bg-muted'
                    }`}
                  >
                    <span
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                        caps[cap] ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </Card>

          {/* Connector permissions */}
          <Card className="p-4 bg-card border-border">
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Connector Permissions</p>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-xs text-muted-foreground border-b border-border">
                    <th className="text-left pb-2 pr-4">Connector</th>
                    {(['read', 'write', 'delete'] as ConnectorAction[]).map(action => (
                      <th key={action} className="text-center pb-2 px-2 capitalize">{action}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {connectors.map(([connector, actions]) => (
                    <tr key={connector} className="border-b border-border/50 last:border-0">
                      <td className="py-2 pr-4 text-muted-foreground font-mono text-xs">{connector}</td>
                      {(['read', 'write', 'delete'] as ConnectorAction[]).map(action => (
                        <td key={action} className="text-center py-2 px-2">
                          {actions.includes(action) ? (
                            <span className="text-green-600" aria-label={`${connector} ${action} allowed`}>✓</span>
                          ) : (
                            <span className="text-muted-foreground/30" aria-label={`${connector} ${action} not allowed`}>–</span>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
