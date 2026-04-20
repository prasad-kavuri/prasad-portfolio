# Release Checklist

Use this for every version tag. Takes ~10 minutes.

## Pre-release

- [ ] All changes merged to `main`
- [ ] `npm run lint` — 0 errors
- [ ] `npm run test` — all tests passing
- [ ] `npm run build` — clean production build
- [ ] `npm audit --audit-level=high` — 0 high/critical CVEs
- [ ] Vercel preview deploy looks correct

## Version and changelog

- [ ] Bump `package.json` version (`npm version <major|minor|patch> --no-git-tag-version`)
- [ ] Move `[Unreleased]` entries in `CHANGELOG.md` into a new `[x.y.z] - YYYY-MM-DD` section
- [ ] Update `docs/releases/first-public-release.md` (or create a new release note file for major versions)

## Git tag

```bash
git tag -a v<x.y.z> -m "Release v<x.y.z>"
git push origin v<x.y.z>
```

## GitHub release

- [ ] Go to https://github.com/prasad-kavuri/prasad-portfolio/releases/new
- [ ] Select the tag just pushed
- [ ] Title: `v<x.y.z>`
- [ ] Body: paste `docs/releases/first-public-release.md` content (or the relevant release notes)
- [ ] Publish release

## Post-release

- [ ] Verify Vercel production deployment is live at https://www.prasadkavuri.com
- [ ] Submit updated sitemap to Google Search Console (if demo routes changed)
- [ ] Confirm redirect rules are active for any new/changed paths
