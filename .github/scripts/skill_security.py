"""Fail-closed gate for the pinned SkillSpector SARIF contract (static-only)."""

import json
import os
from pathlib import Path
import sys
from urllib.parse import quote, unquote, urlsplit


def resolve_skill(root, value):
    """Accept a single local skill only, never a remote or out-of-repo target."""
    if not value or any(c in value for c in '\r\n'):
        raise ValueError('A local skill directory is required')
    path = (root / value).resolve()
    relative = path.relative_to(root.resolve())
    if relative.parts[:1] != ('skills',) or not (path / 'SKILL.md').is_file():
        raise ValueError('Target must be a skill directory under skills/')
    return relative


def normalize_locations(node, root, skill):
    """Rewrite local artifact URIs, including related locations, not external sources."""
    if isinstance(node, list):
        for child in node:
            normalize_locations(child, root, skill)
    elif isinstance(node, dict):
        location = node.get('artifactLocation')
        if isinstance(location, dict) and 'uri' in location:
            uri = location['uri']
            parsed = urlsplit(uri)
            # Transitive source identities are not files in this checkout.
            external = location.get('properties', {}).get('sourceIdentity')
            if not external and not parsed.scheme and not parsed.netloc:
                if location.get('uriBaseId'):
                    raise ValueError('Unexpected artifact URI base in scanner report')
                candidate = (root / skill / unquote(parsed.path)).resolve()
                relative = candidate.relative_to(root.resolve())
                if not candidate.is_file():
                    raise ValueError('Reported local artifact does not exist in checkout')
                location['uri'] = quote(relative.as_posix(), safe='/')
        for child in node.values():
            normalize_locations(child, root, skill)


def prepare_report(report, root, skill, exit_code):
    # Exit 1 can mean findings or incomplete analysis. Preserve the existing
    # HIGH/CRITICAL policy by inspecting the report rather than blocking all warnings.
    if exit_code not in ('0', '1'):
        raise ValueError('Scanner did not finish normally (missing status or execution error)')
    if report.get('version') != '2.1.0' or not report.get('runs'):
        raise ValueError('Missing SARIF 2.1.0 runs')
    errors = []
    warnings = 0
    for run in report['runs']:
        if run['tool']['driver']['name'].lower() != 'skillspector':
            raise ValueError('Unexpected scanner')
        invocations = run.get('invocations')
        if not invocations:
            raise ValueError('Missing execution/completeness evidence')
        for invocation in invocations:
            completeness = invocation.get('properties', {}).get('analysisCompleteness', {})
            if (invocation.get('executionSuccessful') is not True
                    or completeness.get('isComplete') is not True
                    or completeness.get('status') != 'complete'):
                errors.append('Scanner execution failed or analysis is incomplete')
            if any(n.get('level') == 'error' for n in invocation.get('toolExecutionNotifications', [])):
                errors.append('Scanner reported an execution error')
        if not isinstance(run.get('results'), list):
            raise ValueError('Missing results array')
        for result in run['results']:
            level = result.get('level')
            if level not in ('error', 'warning', 'note', 'none'):
                raise ValueError('Missing or unsupported finding severity')
            if level == 'error':
                errors.append('HIGH/CRITICAL finding detected')
            elif level == 'warning':
                warnings += 1
        normalize_locations(run, root, skill)
    return errors, warnings


def main():
    try:
        root = Path.cwd()
        skill = resolve_skill(root, os.environ.get('SKILL_PATH', ''))
        report = json.loads(Path('skillspector-report.sarif').read_text())
        errors, warnings = prepare_report(report, root, skill, os.environ.get('SCAN_EXIT_CODE', ''))
        # Preserve valid reports even when findings/completeness block the job.
        Path('skillspector-upload.sarif').write_text(json.dumps(report, indent=2) + '\n')
    except (OSError, ValueError, KeyError, TypeError, AttributeError):
        print('::error::Missing, invalid, or unusable SkillSpector report/status; scan gate failed.')
        return 1
    if warnings:
        print(f'::warning::{warnings} medium finding(s) require triage; not blocking under current policy.')
    if errors:
        for error in sorted(set(errors)):
            print(f'::error::{error}')
        return 1
    print('No blocking findings detected by this static-only scan; this is not a security certification.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
