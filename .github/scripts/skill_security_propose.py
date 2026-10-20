"""Print a proposed scope entry for one skill from a SkillSpector SARIF report.

For a human to review and paste into .github/skill-security-scope.json. It never writes the file: the scope is a
reviewed boundary, so refreshing it must stay a deliberate act (see docs/SKILL_SECURITY_SCOPE.md).

Usage: python3 .github/scripts/skill_security_propose.py skills/self-heal skillspector-report.sarif
"""
import hashlib
import json
from pathlib import Path
import re
import subprocess
import sys

PATH_RE = re.compile(r"[\w./-]+\.(?:ts|tsx|json|md|txt|yaml|yml|mjs)\b|[\w-]+/[\w./-]+")


def propose(root, skill, report):
    skill_dir = root / skill
    text = (skill_dir / 'SKILL.md').read_bytes()
    lines_of_text = text.decode().split('\n')
    invocation = report['runs'][0]['invocations'][0]
    lines = sorted(n['locations'][0]['physicalLocation']['region']['startLine']
                   for n in invocation.get('toolExecutionNotifications', []))
    tracked = set(subprocess.check_output(['git', 'ls-files', '-z'], cwd=root, text=True).split('\0'))
    names = set()
    for number in lines:
        names.update(PATH_RE.findall(lines_of_text[number - 1]))
    return {
        'skill': Path(skill).as_posix(),
        'skill_sha256': hashlib.sha256(text).hexdigest(),
        'reference_lines': lines,
        'application_files': sorted(n for n in names if n in tracked),
    }


if __name__ == '__main__':
    entry = propose(Path.cwd(), sys.argv[1], json.loads(Path(sys.argv[2]).read_text()))
    print(json.dumps(entry, indent=2))
    print('Review each reference line and application file by hand before pasting this entry.', file=sys.stderr)
