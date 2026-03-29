# Deployment Notes

This site is a static frontend. Anything sent to the browser is public.

## n8n

Use public webhook URLs in the frontend config. Keep real secrets inside n8n workflows, credentials, or downstream services.

Forms already map to these webhook keys:

- `newsletter-subscribe`
- `general-contact`
- `designer-intake`

## Local setup

1. Fill in [`.env`](/Users/maxj/Documents/dropo1/.env).
2. Generate the local override:

```sh
./scripts/generate-site-config.sh
```

That writes `assets/js/site-config.local.js`, which is ignored by git and loaded after the tracked public config.

## Static deploy setup

If you want the webhook URLs to ship with the site, generate the tracked public config:

```sh
./scripts/generate-site-config.sh .env assets/js/site-config.public.js
```

Then deploy the repo normally. For GitHub Pages, commit the updated `assets/js/site-config.public.js` before publishing. For hosts with a build step, you can run the same command during deploy instead of committing the generated file.
