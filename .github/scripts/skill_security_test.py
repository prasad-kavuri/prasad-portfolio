"""Regression tests for report failures, risk policy, and repository paths."""
import copy
import hashlib
import json
import os
import re
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from skill_security import prepare_report, resolve_skill, select_policy
from skill_security_propose import propose


def report(level=None):
    return {'version': '2.1.0', 'runs': [{
        'tool': {'driver': {'name': 'skillspector'}},
        'invocations': [{'executionSuccessful': True, 'properties': {
            'analysisCompleteness': {'isComplete': True, 'status': 'complete'}}}],
        'results': [] if level is None else [{'ruleId': 'RA2', 'level': level,
            'message': {'text': 'Session Persistence'}, 'locations': [{
                'physicalLocation': {'artifactLocation': {'uri': 'SKILL.md'}}}]}]}]}


class GateTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.root = Path(self.temp.name).resolve()
        self.skill = Path('skills/example')
        (self.root / self.skill).mkdir(parents=True)
        (self.root / self.skill / 'SKILL.md').write_text('# Example')

    def check(self, data, code='0'):
        return prepare_report(data, self.root, self.skill, code)

    def test_clean_and_warning_policy(self):
        self.assertEqual(self.check(report()), ([], 0))
        self.assertEqual(self.check(report('warning'), '1'), ([], 1))

    def test_high_blocks(self):
        self.assertTrue(self.check(report('error'), '1')[0])

    def test_incomplete_and_failed_block(self):
        for field in ('isComplete', 'executionSuccessful'):
            data = report()
            invocation = data['runs'][0]['invocations'][0]
            target = invocation if field == 'executionSuccessful' else invocation['properties']['analysisCompleteness']
            target[field] = False
            self.assertTrue(self.check(data)[0])

    def test_partial_status_and_error_notifications_block(self):
        data = report()
        invocation = data['runs'][0]['invocations'][0]
        invocation['properties']['analysisCompleteness']['status'] = 'partial'
        self.assertTrue(self.check(data)[0])
        data = report()
        data['runs'][0]['invocations'][0]['toolExecutionNotifications'] = [{'level': 'error'}]
        self.assertTrue(self.check(data)[0])

    def test_missing_metadata_and_results_rejected(self):
        for key in ('invocations', 'results'):
            data = report(); del data['runs'][0][key]
            with self.assertRaises(ValueError): self.check(data)
        with self.assertRaises(ValueError): self.check({'version': '2.1.0', 'runs': []})

    def test_crash_or_missing_exit_code_rejected(self):
        for code in ('', '2', '137'):
            with self.assertRaises(ValueError): self.check(report(), code)

    def test_paths_include_skill_directory(self):
        data = report('warning')
        self.check(data)
        location = data['runs'][0]['results'][0]['locations'][0]['physicalLocation']['artifactLocation']
        self.assertEqual(location['uri'], 'skills/example/SKILL.md')

    def test_nested_and_related_locations(self):
        (self.root / self.skill / 'references').mkdir()
        (self.root / self.skill / 'references' / 'my guide.md').write_text('Guide')
        data = report('note')
        result = data['runs'][0]['results'][0]
        result['relatedLocations'] = [{'physicalLocation': {'artifactLocation': {
            'uri': 'references/my%20guide.md'}}}]
        self.check(data)
        self.assertEqual(result['relatedLocations'][0]['physicalLocation']['artifactLocation']['uri'],
                         'skills/example/references/my%20guide.md')

    def test_external_sources_unchanged(self):
        data = report('warning')
        location = data['runs'][0]['results'][0]['locations'][0]['physicalLocation']['artifactLocation']
        location.update(uri='external/hash/SKILL.md', properties={'sourceIdentity': 'external/hash'})
        self.check(data)
        self.assertEqual(location['uri'], 'external/hash/SKILL.md')

    def test_path_escape_and_invalid_target_rejected(self):
        for value in ('', '../outside', 'https://example.com', 'skills/example\ninjected'):
            with self.assertRaises(ValueError): resolve_skill(self.root, value)
        self.assertEqual(resolve_skill(self.root, './skills/example'), self.skill)
        data = report('warning')
        data['runs'][0]['results'][0]['locations'][0]['physicalLocation']['artifactLocation']['uri'] = '../../../outside'
        with self.assertRaises(ValueError): self.check(data)

    def test_cli_missing_malformed_and_valid_reports(self):
        script = str(Path(__file__).with_name('skill_security.py').resolve())
        for content, expected in [(None, 1), ('not json', 1), ('{}', 1),
                                  (json.dumps(report()), 0), (json.dumps(report('error')), 1)]:
            if content is not None:
                (self.root / 'skillspector-report.sarif').write_text(content)
            result = subprocess.run([sys.executable, '-B', script], cwd=self.root,
                env={**os.environ, 'SKILL_PATH': str(self.skill), 'SCAN_EXIT_CODE': '0'},
                capture_output=True, text=True)
            self.assertEqual(result.returncode, expected, result.stdout)
        self.assertTrue((self.root / 'skillspector-upload.sarif').is_file())

    def scoped_fixture(self):
        data = report('warning')
        invocation = data['runs'][0]['invocations'][0]
        invocation['properties']['analysisCompleteness'] = {
            'isComplete': False, 'status': 'partial', 'coveragePercent': 100.0,
            'totalComponents': 1, 'fullyInspectedFiles': 1, 'partiallyInspectedFiles': 0,
            'entirelyUninspectedFiles': 0, 'ledgerExceptionCount': 1,
            'scopeExclusionCount': 0, 'limitationCount': 0, 'notificationsTruncated': False}
        invocation['toolExecutionNotifications'] = [{
            'level': 'warning', 'properties': {'outcome': 'partial',
                'phase': 'reference_resolution', 'reasonCode': 'reference_missing', 'fatal': False},
            'locations': [{'physicalLocation': {'artifactLocation': {'uri': 'SKILL.md'},
                'region': {'startLine': 1, 'endLine': 1}}}]}]
        policy = {'skill': str(self.skill), 'skill_sha256': hashlib.sha256(b'# Example').hexdigest(),
                  'reference_lines': [1], 'application_files': []}
        return data, policy

    def scoped_check(self, data, policy):
        with patch('skill_security.subprocess.check_output', return_value='app.ts\0'):
            return prepare_report(data, self.root, self.skill, '1', policy)

    def test_scoped_references_pass_without_changing_completeness(self):
        data, policy = self.scoped_fixture()
        completeness = copy.deepcopy(data['runs'][0]['invocations'][0]['properties'])
        self.assertEqual(self.scoped_check(data, policy), ([], 1))
        self.assertEqual(data['runs'][0]['invocations'][0]['properties'], completeness)

    def test_scope_does_not_hide_high_findings(self):
        data, policy = self.scoped_fixture()
        data['runs'][0]['results'][0]['level'] = 'error'
        self.assertIn('HIGH/CRITICAL finding detected', self.scoped_check(data, policy)[0])

    def test_scope_rejects_changed_text_or_added_file(self):
        data, policy = self.scoped_fixture()
        (self.root / self.skill / 'SKILL.md').write_text('Changed')
        self.assertTrue(self.scoped_check(copy.deepcopy(data), policy)[0])
        (self.root / self.skill / 'SKILL.md').write_text('# Example')
        (self.root / self.skill / 'extra.md').write_text('Extra')
        self.assertTrue(self.scoped_check(data, policy)[0])

    def test_scope_rejects_missing_untracked_and_symlinked_app_reference(self):
        data, policy = self.scoped_fixture()
        policy['application_files'] = ['app.ts']
        self.assertTrue(self.scoped_check(copy.deepcopy(data), policy)[0])
        (self.root / 'app.ts').write_text('const a = 1')
        self.assertFalse(self.scoped_check(copy.deepcopy(data), policy)[0])
        policy['application_files'] = ['untracked.ts']
        (self.root / 'untracked.ts').write_text('const a = 1')
        self.assertTrue(self.scoped_check(copy.deepcopy(data), policy)[0])
        policy['application_files'] = ['app.ts']
        (self.root / 'app.ts').unlink()
        (self.root / 'app.ts').symlink_to(self.root / 'untracked.ts')
        self.assertTrue(self.scoped_check(data, policy)[0])

    def test_scope_rejects_any_other_incomplete_evidence(self):
        for key, value in [('limitationCount', 1), ('scopeExclusionCount', 1),
                           ('notificationsTruncated', True), ('coveragePercent', 50),
                           ('partiallyInspectedFiles', 1), ('entirelyUninspectedFiles', 1),
                           ('ledgerExceptionCount', 2), ('totalComponents', 2)]:
            with self.subTest(key=key):
                data, policy = self.scoped_fixture()
                data['runs'][0]['invocations'][0]['properties']['analysisCompleteness'][key] = value
                self.assertTrue(self.scoped_check(data, policy)[0])
        for key, value in [('reasonCode', 'static_parse_limit'), ('fatal', True),
                           ('phase', 'other'), ('outcome', 'failed')]:
            data, policy = self.scoped_fixture()
            data['runs'][0]['invocations'][0]['toolExecutionNotifications'][0]['properties'][key] = value
            self.assertTrue(self.scoped_check(data, policy)[0])

    def test_scope_rejects_unknown_lines_duplicate_or_missing_notifications(self):
        for kind in ('line', 'duplicate', 'missing', 'failed', 'other_skill'):
            data, policy = self.scoped_fixture()
            invocation = data['runs'][0]['invocations'][0]
            notes = invocation['toolExecutionNotifications']
            if kind == 'line':
                notes[0]['locations'][0]['physicalLocation']['region'] = {'startLine': 2, 'endLine': 2}
            elif kind == 'duplicate': notes.append(copy.deepcopy(notes[0]))
            elif kind == 'missing': notes.clear()
            elif kind == 'failed': invocation['executionSuccessful'] = False
            else: policy['skill'] = 'skills/another'
            self.assertTrue(self.scoped_check(data, policy)[0], kind)


if __name__ == '__main__':
    unittest.main()


REPO = Path(__file__).resolve().parents[2]


class ScopeFileTests(unittest.TestCase):
    """The reviewed scope file, the skills folder and the workflow must describe the same nine skills."""

    def setUp(self):
        self.document = json.loads((REPO / '.github/skill-security-scope.json').read_text())
        found = [p for p in (REPO / 'skills').iterdir() if (p / 'SKILL.md').is_file()]
        found += [p for plugin in (REPO / 'plugins').iterdir() if (plugin / 'skills').is_dir()
                  for p in (plugin / 'skills').iterdir() if (p / 'SKILL.md').is_file()]
        self.on_disk = sorted(p.relative_to(REPO).as_posix() for p in found)

    def test_every_skill_has_exactly_one_reviewed_entry(self):
        listed = sorted(e['skill'] for e in self.document['skills'])
        self.assertEqual(listed, self.on_disk)
        self.assertEqual(len(listed), len(set(listed)))

    def test_every_skill_is_in_the_workflow_matrix(self):
        text = (REPO / '.github/workflows/skill-security.yml').read_text()
        in_matrix = sorted(re.findall(r'path: (\S+) \}', text))
        self.assertEqual(in_matrix, self.on_disk)

    def test_entries_match_current_skill_text_and_files(self):
        tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=REPO, text=True).split('\0'))
        for entry in self.document['skills']:
            data = (REPO / entry['skill'] / 'SKILL.md').read_bytes()
            self.assertEqual(hashlib.sha256(data).hexdigest(), entry['skill_sha256'], entry['skill'] + ' changed: refresh its entry on purpose')
            self.assertEqual(entry['reference_lines'], sorted(entry['reference_lines']))
            lines = data.decode().split('\n')
            self.assertTrue(all(1 <= n <= len(lines) for n in entry['reference_lines']), entry['skill'])
            for name in entry['application_files']:
                self.assertIn(name, tracked, f"{entry['skill']} references untracked {name}")

    def test_select_policy(self):
        entry = self.document['skills'][0]
        self.assertEqual(select_policy(self.document, Path(entry['skill'])), entry)
        self.assertIsNone(select_policy(self.document, Path('skills/unknown')))
        self.assertIsNone(select_policy(None, Path(entry['skill'])))
        # Plugin skills resolve too; anything else does not.
        root = REPO
        self.assertEqual(resolve_skill(root, 'plugins/prasad-profile/skills/evaluate-fit').as_posix(),
                         'plugins/prasad-profile/skills/evaluate-fit')
        for bad in ('plugins/prasad-profile', 'plugins/prasad-profile/skills', 'docs', '../x', 'skills/../docs'):
            with self.assertRaises((ValueError, OSError)):
                resolve_skill(root, bad)
        self.assertEqual(select_policy(entry, Path(entry['skill'])), entry)
        with self.assertRaises(ValueError):
            select_policy({'skills': [entry, entry]}, Path(entry['skill']))


class ProposeTests(unittest.TestCase):
    def test_proposal_reproduces_the_reviewed_entry(self):
        # Build a synthetic report whose notices sit on the reviewed lines of one skill.
        document = json.loads((REPO / '.github/skill-security-scope.json').read_text())
        entry = next(e for e in document['skills'] if e['skill'] == 'skills/testing')
        notices = [{'locations': [{'physicalLocation': {'region': {'startLine': n, 'endLine': n}}}]}
                   for n in entry['reference_lines']]
        fake = {'runs': [{'invocations': [{'toolExecutionNotifications': notices}]}]}
        self.assertEqual(propose(REPO, 'skills/testing', fake), entry)


class PluginPackagingTests(unittest.TestCase):
    """Marketplace and plugin manifests must stay valid and match the repo (SPEC-0045)."""
    RESERVED = ('claude-', 'anthropic-', 'anthropics-', 'cc-plugin-')

    def setUp(self):
        self.market = json.loads((REPO / '.claude-plugin/marketplace.json').read_text())

    def test_marketplace_entries_match_plugin_manifests(self):
        self.assertTrue(self.market['plugins'])
        self.assertIn('name', self.market['owner'])
        for entry in self.market['plugins']:
            source = entry['source']
            self.assertTrue(source.startswith('./') and '..' not in source, source)
            plugin_dir = REPO / source
            manifest = json.loads((plugin_dir / '.claude-plugin/plugin.json').read_text())
            self.assertEqual(entry['name'], manifest['name'])
            for name in (entry['name'], self.market['name']):
                self.assertRegex(name, r'^[a-z0-9]+(-[a-z0-9]+)*$')
                self.assertFalse(name.startswith(self.RESERVED), name)
                self.assertNotIn('official', name)
            self.assertTrue((plugin_dir / 'skills').is_dir())

    def test_mcp_connector_points_at_the_public_server_over_https(self):
        for entry in self.market['plugins']:
            mcp = REPO / entry['source'] / '.mcp.json'
            if not mcp.is_file():
                continue
            for name, server in json.loads(mcp.read_text())['mcpServers'].items():
                self.assertEqual(server['type'], 'http', name)
                self.assertEqual(server['url'], 'https://www.prasadkavuri.com/api/mcp', name)
                self.assertNotIn('headers', server, 'no credentials belong in a published plugin')
                self.assertNotIn('env', server, name)

    def test_root_manifest_uses_valid_field_shapes(self):
        manifest = json.loads((REPO / '.claude-plugin/plugin.json').read_text())
        skills = manifest.get('skills', [])
        skills = [skills] if isinstance(skills, str) else skills
        self.assertTrue(all(isinstance(path, str) and path.startswith('./') for path in skills))


class LicenseTests(unittest.TestCase):
    """LICENSE, NOTICE and every manifest must agree (SPEC-0046)."""

    def test_license_files_and_manifests_agree(self):
        license_text = (REPO / 'LICENSE').read_text()
        self.assertTrue(license_text.startswith('MIT License'))
        self.assertIn('Prasad Kavuri', license_text)
        notice = (REPO / 'NOTICE').read_text()
        self.assertIn('all rights reserved', notice)
        manifests = [REPO / '.claude-plugin/plugin.json']
        manifests += sorted((REPO / 'plugins').glob('*/.claude-plugin/plugin.json'))
        for path in manifests:
            self.assertEqual(json.loads(path.read_text()).get('license'), 'MIT', str(path))
        self.assertEqual(json.loads((REPO / 'package.json').read_text()).get('license'), 'MIT')
