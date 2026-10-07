# Project Version Update Instructions

Use this guide when changing the `ngx-query-builder` project or release version. Keep the library version consistent across package metadata and user-facing publishing examples; do not confuse it with Angular or other dependency versions.

## Update the version

1. Choose the new project version and identify the previous version. Update the `version` field in both `package.json` and `projects/ngx-query-builder/package.json`.
2. Synchronize the root project's version metadata in `package-lock.json`: update the top-level `version` and the `packages[""].version` value. Leave dependency versions and the lockfile format unchanged.
3. Search the repository for the previous version and update project-version references, including examples in `docs/npm-publishing.md` such as package tarball names and install commands. Do not replace unrelated versions that happen to match.
4. Review the diff to confirm that only intended project-version references changed.

## Verify the update

Search for remaining references to the previous version:

```bash
rg -n --fixed-strings --hidden --glob '!.git/**' '<previous-version>' .
```

Parse the three JSON files and confirm the version fields match:

```bash
node -e "const fs=require('node:fs'); for (const p of ['package.json','projects/ngx-query-builder/package.json','package-lock.json']) { const j=JSON.parse(fs.readFileSync(p,'utf8')); console.log(p, p==='package-lock.json' ? j.version+'/'+j.packages[''].version : j.version); }"
```

Check the final diff for accidental dependency changes:

```bash
git diff --check
git diff
```
