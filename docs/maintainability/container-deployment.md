# Optional container deployment

The app still supports `npm ci`, `npm run dev`, `npm run build`, and `npm start`.
Docker and Coolify are optional. All calendar data stays in the user's browser.

## Local Docker

```bash
docker build --build-arg NEXT_PUBLIC_SITE_URL=https://calendar.example.com -t expense-calendar .
docker run --rm -p 3000:3000 expense-calendar
```

The image uses Node 22 and Next.js standalone output, runs as the unprivileged
`node` user, and includes public and compiled static assets. It listens on
`0.0.0.0:3000`. No database or persistent volume is needed. The host should route
HTTPS through a reverse proxy rather than exposing the app port publicly.

`NEXT_PUBLIC_SITE_URL` and `APP_ENV` are build arguments. The URL defaults to
`http://localhost:3000`; production deployers should provide their actual URL.
Changing it requires rebuilding, because metadata can be generated at build
time. Public URLs are not secrets and may appear in the generated site/image.
Never put credentials in build arguments or `NEXT_PUBLIC_` variables. `.env`
files are excluded from Docker's build context.

## GitHub Actions

The existing CI checks still run. After they pass, a standard Ubuntu runner
builds the Docker image, starts it, and checks the homepage and a CSS asset.
Pull requests and `stage` builds validate the image without publishing it.
Successful `main` pushes and manual runs on `main` publish both:

- `ghcr.io/<lowercase-owner>/<lowercase-repository>:latest`
- `ghcr.io/<lowercase-owner>/<lowercase-repository>:<full-commit-sha>`

Image publishing uses GitHub's automatically supplied `GITHUB_TOKEN` with
`packages:write`; no registry password needs to be committed or added manually.
Docker actions are pinned to specific commits. Update those pins deliberately.
The workflow caches build layers and serializes container jobs per branch.

Under repository Settings > Secrets and variables > Actions, set the repository
variable `SITE_URL` to the public deployment URL before the first production
image build. Fork owners supply their own settings; the workflow derives image
names from their repository rather than publishing to the original owner's
package. Review/enable Actions on a fork before using it.

New GitHub packages can initially be private even when their source repository
is public. After the first publication, choose the intended package visibility.
For a public image, Coolify can pull without credentials. For a private image,
configure registry authentication on the deployment server with a token allowed
to read that package. Keep the image private until deliberately made public.
Never publish an image containing secrets or private configuration.

## Optional Coolify integration

1. Cancel the old source build and disable its Git auto-deploy trigger. Do not
   leave the old Git resource building on pushes to `main`.
2. Create a Docker Image resource on the deployment server, using the published
   image repository and tag `latest`. Expose internal port `3000`; leave public
   port mappings and start-command overrides empty. No build runs on this host.
3. Configure required registry login if the package is private. Keep runtime
   `APP_ENV=production`; public metadata settings must already be in the image.
4. Stop the previous resource before moving its domain to the image resource;
   do not assign the same domain to both. Keep the hostname stable so browser
   storage remains available. Test homepage, CSS/JS, and normal calendar usage.
5. In Coolify, obtain the image resource's deploy webhook URL and an API token
   with the deployment access supported by your installed version.
6. Store them as GitHub repository secrets `COOLIFY_DEPLOY_URL` and
   `COOLIFY_API_TOKEN`. The URL must use HTTPS. Do not commit either value or
   paste tokens into issues, logs, or documentation.
7. Only after the image resource works, set GitHub variable
   `COOLIFY_AUTO_DEPLOY=true`. Without it, image publishing works and the deploy
   step is skipped. Main pushes will request deployment after publishing.
8. Verify the deployment in Coolify: webhook acceptance only means the request
   was accepted, not that the rollout is healthy. Re-enable any temporarily
   disabled Cloudflare proxy records and verify HTTPS again.

No real target domain, server address, webhook URL, or credential is committed
in this integration. Public source and workflow logs remain public; do not echo
deployment secrets. The workflow sends the API token as a header and suppresses
the webhook response body.

## Rollback

Set the Coolify image tag to a previously successful full commit SHA and deploy.
Disable `COOLIFY_AUTO_DEPLOY` first so a new push does not replace the rollback.
Do not use server-volume backups as a substitute for the app's JSON export:
calendar data resides in browser storage and changing origins needs export/import.
