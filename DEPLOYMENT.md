# Production deployment

BumpMarks V1 is designed to deploy as a static site.

Flask remains useful for local development, but the production bundle contains
only HTML, CSS, JavaScript, the service worker, manifest, icons, and images.
Movement records remain in the user's browser and are never processed by a
production application server.

## Build locally

```cmd
build.cmd
```

The generated production bundle is written to `dist/`.

## Deploy to Render

The repository includes `render.yaml`, which defines a Render Static Site.

On Windows, after the repository has been pushed to GitHub, run:

```cmd
deploy_render.cmd
```

The script reads the existing `origin` remote and opens Render's Blueprint
deployment page for that repository. Review the Blueprint and approve the
initial deployment.

After that initial authorization, Render can deploy `main` only after GitHub
checks pass.

After Render reports the deploy as live, verify the production site with:

```cmd
verify_production.cmd https://your-live-domain
```

This checks the public landing page, tracker, health/version response, service
worker, manifest, HTTPS, and core security headers.

The Render service name is `bumpmarks-pwa`, so the default Render URL should
include `bumpmarks-pwa` if that subdomain is available. Render may require a
unique variation if the name is already taken.

## Custom domain

A custom domain is optional. Configure it from the Render service settings and
then add the DNS records Render provides at the domain registrar/DNS provider.
Render manages HTTPS certificates for the custom domain.

## Production routes

- `/` - public landing page
- `/app` - BumpMarks tracker
- `/offline` - offline fallback
- `/healthz` - static release health/version response
- `/sw.js` - service worker

## Release

After committing and pushing the final release changes, run:

```cmd
release_v1.cmd https://your-live-domain
```

The production URL is optional, but supplying it makes the release script run
the live verification before the Git tag is created.

The script runs the full local checks, requires a clean Git working tree,
creates the annotated `v1.0.0` tag, and pushes it.

The tag triggers `.github/workflows/release.yml`, which runs CI again, builds
the production bundle, creates a ZIP asset, and publishes the GitHub Release.
