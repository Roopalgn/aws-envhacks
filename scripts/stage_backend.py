"""Stage only application Python files; never package the repository or secrets."""
from pathlib import Path
import shutil

root=Path(__file__).resolve().parents[1]
target=root/'.local/lambda/backend'
target.mkdir(parents=True,exist_ok=True)
for path in (root/'backend').glob('*.py'):
    shutil.copy2(path,target/path.name)
print(f'Staged Python backend in {target.parent}')
