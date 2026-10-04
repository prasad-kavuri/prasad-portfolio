"""Regression tests for report failures, risk policy, and repository paths."""
import json
import os
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest

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


if __name__ == '__main__':
    unittest.main()
