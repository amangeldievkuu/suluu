# Releasing Suluu

Suluu releases are built from a commit already contained in `main`, validated
again, published to npm with provenance, and then recorded as a GitHub release.
Do not publish from a developer workstation.

## Repository protection

Configure `main` to require pull requests and these CI checks:

- Quality
- Unit and accessibility tests (Node 22.22.2)
- Unit and accessibility tests (Node 24.15.0)
- Unit and accessibility tests (Node 26)
- Package and registry consumers
- Documentation build
- Browser interactions (chromium)
- Browser interactions (firefox)
- Browser interactions (webkit)
- Visual regression (Chromium on macOS)

Create a protected GitHub environment named `npm`, require a maintainer's
approval, restrict it to `main`, and protect tags matching `v*`. The publish job
has only `contents: write` and `id-token: write`; all verification jobs are
read-only. If the tag rule uses a bypass list, allow the GitHub Actions app to
create a tag only through the approved publish environment.

Once the npm package exists, configure npm trusted publishing for this GitHub
repository, `publish.yml`, the `npm` environment, and the `npm publish` action.
The repository must remain public for npm provenance. Future publishes should
use OpenID Connect and should not keep a long-lived npm token.

## Prepare a version

1. Update the version in the root, documentation, registry, and npm package
   manifests.
2. Move the finished entries from `Unreleased` into a dated changelog section.
3. Update `REGISTRY_VERSION` in `packages/registry/src/registry-item.ts`, then
   regenerate the public files.
4. Run the release checks:

   ```bash
   pnpm registry:generate
   pnpm validate:release
   pnpm test:visual
   pnpm release:check -- 0.2.0
   ```

5. Inspect the package before merging:

   ```bash
   pnpm --dir packages/suluu pack --dry-run
   ```

Replace `0.2.0` with the version being prepared. Merge only after all required
checks pass on the pull request and then on `main`.

## Product acceptance pass

Before a release, review the documentation build in Chrome, Safari, and Firefox
at desktop and mobile widths. Check light mode, dark mode, keyboard-only use,
and reduced motion. Exercise component-specific state changes rather than only
loading each page. Automated browser and visual tests are release gates, but
this pass catches compositional and perceptual issues that assertions can miss.

## Publish

Run the **Publish release** workflow with the exact version and a `main` commit
or ref. Leave `bootstrap` off. The workflow:

1. Confirms the commit belongs to `main` and all versioned artifacts agree.
2. Runs the full workspace, cross-browser, and visual gates.
3. Waits for approval in the `npm` environment.
4. Packs the public artifact, publishes it with provenance, creates a checksum,
   and creates `v<version>` with changelog-derived release notes.

The workflow is safe to rerun after an interruption: an existing npm version is
accepted only when its `gitHead` matches the verified commit, and an existing
GitHub release is not recreated.

## First npm publish only

npm trusted publishing must be configured on an existing package. For the first
publish, create a short-lived granular npm token with the minimum available
publishing scope and store it as `NPM_BOOTSTRAP_TOKEN` in the protected `npm`
environment. Run the workflow once with `bootstrap` enabled.

After that run succeeds:

1. Revoke the npm token and delete `NPM_BOOTSTRAP_TOKEN` from GitHub.
2. Configure the npm trusted publisher for this repository and workflow.
3. In the npm package settings, disallow token-based publishing after the OIDC
   path is working.
4. Confirm a normal workflow run can reach the protected environment with
   `bootstrap` disabled.

Never reuse the bootstrap token for routine releases.

## Verify and recover

Confirm the npm version, provenance record, GitHub tag, attached tarball, and
checksum after publishing. npm versions are immutable: if a release is wrong,
deprecate it when appropriate, prepare a corrected patch version, rerun all
gates, and publish the fix. Do not move an existing version tag to different
code.
