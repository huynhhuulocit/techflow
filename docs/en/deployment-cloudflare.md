# Deploy TechFlow with Cloudflare Pages

TechFlow is deployed as a static Vite site from GitHub. Production does not run the local author API and does not contain an OpenAI API key.

## Project configuration

Connect `huynhhuulocit/techflow` through Cloudflare Pages Git integration and use these values:

| Setting | Value |
| --- | --- |
| Project name | `techflow` |
| Production branch | `main` |
| Framework preset | `Vite` |
| Root directory | Blank |
| Build command | `npm run verify:deploy` |
| Build output directory | `dist` |
| Node.js | `22.16.0`, pinned by `.node-version` |

Set `VITE_ENABLE_AUTHOR_STUDIO=false` for both Production and Preview. Do not define `OPENAI_API_KEY`, `OPENAI_MODEL`, or `TECHFLOW_AUTHOR_TOKEN` in Cloudflare Pages; those variables belong only to the local Vite author API.

The project has no Pages Functions, Worker, or server-side route. Navigation currently uses client state instead of a path router, so `_redirects` is not required yet.

## Automatic delivery flow

1. Codex completes a request in the standalone repository.
2. Run `npm run verify:deploy` and any relevant browser checks.
3. When validation passes, Codex commits and pushes the current branch without a separate review gate.
4. A push to `main` triggers an automatic production deployment.
5. A push to another branch creates a preview deployment when Preview branches are enabled.

Do not push failed validation, secrets, or unrelated changes.

## Review on iPhone

After the first deployment, the production URL is expected to look like `https://techflow.pages.dev`. If that name is unavailable, use the actual hostname shown in the Cloudflare dashboard.

Locale and Question Studio drafts use browser storage. Local data from the Windows browser does not automatically appear on the iPhone; only content committed to source and deployed is shared across devices.

## Single-user access

The `pages.dev` hostname is public by default. After production is live, enable Cloudflare Access for both the production and preview hostnames:

1. In the Pages project, open **Settings > General > Enable access policy**. The initially generated policy protects preview deployments only.
2. Select **Manage** on that Access policy, open the project's application, and select **Configure**.
3. Under **Public hostname**, remove the `*` wildcard from the Subdomain field and save. This application now protects `techflow.pages.dev`.
4. Return to Pages **Settings > General** and enable the access policy again if preview deployments also need protection. The final configuration contains one application for the production hostname and one for wildcard previews.

The `Allow` policy should use the **Cloudflare Account Member** selector for the current account. Alternatively, use One-time PIN with an **Emails** selector containing only the account owner's exact email. Do not use `Login Methods = One-time PIN` as the only condition because that would admit every email able to authenticate.

Connecting GitHub and creating the Access policy changes external permissions, so each action must be confirmed at the relevant dashboard step.

Cloudflare Pages Free currently allows 500 builds per month; static requests that do not invoke Pages Functions are not counted as Functions requests.

## Rollback

In Cloudflare Pages, open the project, select **Deployments**, open a known-good deployment, and use the rollback or promotion action currently offered by the dashboard. For source-level recovery, revert the faulty commit and push `main` to create a traceable replacement deployment.

See the official [Git integration](https://developers.cloudflare.com/pages/configuration/git-integration/), [Vite deployment](https://developers.cloudflare.com/pages/framework-guides/deploy-a-vite3-project/), [build image](https://developers.cloudflare.com/pages/configuration/build-image/), [preview deployments](https://developers.cloudflare.com/pages/configuration/preview-deployments/), and [production pages.dev Access procedure](https://developers.cloudflare.com/pages/platform/known-issues/#enable-access-on-your-pagesdev-domain) documentation.
