"""Fail-closed gate for the pinned SkillSpector SARIF contract (static-only)."""

import hashlib
import json
import os
from pathlib import Path
import sys
import subprocess
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


def reviewed_reference_scope(invocation, root, skill, policy):
    """Accept only the exact reviewed boundary, never general incomplete analysis.

    The original SARIF remains partial. Application code belongs to the separate
    CI security checks; this exception is not evidence that it was inspected here.
    """
    if not policy or policy.get('skill') != skill.as_posix():
        return False
    if invocation.get('executionSuccessful') is not True:
        return False
    directory = root / skill
    files = [p for p in directory.rglob('*') if p.is_file() or p.is_symlink()]
    if files != [directory / 'SKILL.md'] or files[0].is_symlink():
        return False
    if hashlib.sha256(files[0].read_bytes()).hexdigest() != policy['skill_sha256']:
        return False
    # Referenced application files must still exist and be version controlled.
    tracked = set(subprocess.check_output(
        ['git', 'ls-files', '-z'], cwd=root, text=True).split('\0'))
    for name in policy['application_files']:
        path = root / name
        if name not in tracked or not path.is_file() or path.is_symlink():
            return False
        if not path.resolve().is_relative_to(root.resolve()):
            return False
    completeness = invocation.get('properties', {}).get('analysisCompleteness', {})
    expected = {'isComplete': False, 'status': 'partial', 'coveragePercent': 100.0,
        'totalComponents': 1, 'fullyInspectedFiles': 1, 'partiallyInspectedFiles': 0,
        'entirelyUninspectedFiles': 0, 'ledgerExceptionCount': len(policy['reference_lines']),
        'scopeExclusionCount': 0, 'limitationCount': 0, 'notificationsTruncated': False}
    if any(completeness.get(key) != value for key, value in expected.items()):
        return False
    lines = []
    for notification in invocation.get('toolExecutionNotifications', []):
        if notification.get('level') != 'warning' or notification.get('properties') != {
                'outcome': 'partial', 'phase': 'reference_resolution',
                'reasonCode': 'reference_missing', 'fatal': False}:
            return False
        locations = notification.get('locations', [])
        if len(locations) != 1:
            return False
        physical = locations[0].get('physicalLocation', {})
        if physical.get('artifactLocation') != {'uri': 'SKILL.md'}:
            return False
        region = physical.get('region', {})
        if region.get('startLine') != region.get('endLine'):
            return False
        lines.append(region.get('startLine'))
    return sorted(lines) == policy['reference_lines']


def prepare_report(report, root, skill, exit_code, policy=None):
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
                if not reviewed_reference_scope(invocation, root, skill, policy):
                    reasons = sorted({str(n.get('properties', {}).get('reasonCode', 'unknown'))
                        for n in invocation.get('toolExecutionNotifications', [])})
                    errors.append('Scanner execution failed or analysis is incomplete; reasons: '
                                  + ', '.join(reasons or ['missing completeness evidence']))
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
        policy_path = Path('.github/skill-security-scope.json')
        policy = json.loads(policy_path.read_text()) if policy_path.is_file() else None
        errors, warnings = prepare_report(report, root, skill, os.environ.get('SCAN_EXIT_CODE', ''), policy)
        # Preserve valid reports even when findings/completeness block the job.
        Path('skillspector-upload.sarif').write_text(json.dumps(report, indent=2) + '\n')
    except (OSError, ValueError, KeyError, TypeError, AttributeError, subprocess.SubprocessError):
        print('::error::Missing, invalid, or unusable SkillSpector report/status; scan gate failed.')
        return 1
    if warnings:
        print(f'::warning::{warnings} medium finding(s) require triage; not blocking under current policy.')
    if errors:
        for error in sorted(set(errors)):
            escaped = error.replace('%', '%25').replace('\r', '%0D').replace('\n', '%0A')
            print(f'::error::{escaped}')
        return 1
    if any(i['properties']['analysisCompleteness']['isComplete'] is not True
           for run in report['runs'] for i in run['invocations']):
        message = ('Scoped skill gate passed with reviewed reference exceptions. '
                   'SkillSpector analysis remains PARTIAL; application code is covered separately '
                   'by CI, not this scan. See docs/SKILL_SECURITY_SCOPE.md.')
        print(f'::warning::{message}')
        if os.environ.get('GITHUB_STEP_SUMMARY'):
            with open(os.environ['GITHUB_STEP_SUMMARY'], 'a') as summary:
                summary.write(f'### Skill-only security scope\n\n{message}\n')
    print('No blocking findings detected by this static-only scan; this is not a security certification.')
    return 0


if __name__ == '__main__':
    sys.exit(main())
