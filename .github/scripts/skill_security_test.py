"""Regression tests for report failures, risk policy, and repository paths."""
import copy
import hashlib
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

from skill_security import prepare_report, resolve_skill


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
