# Personal Website & Portfolio

A clean, structured, and scalable personal website built with HTML, CSS, and JavaScript.

## Blog posts

Each blog post is a self-contained Markdown file in [`blog/`](./blog/). Its YAML front matter contains the card and author metadata, followed by the article body. The blog listing reads the post files directly, so publishing or updating a post only requires changing one file.

## Blog editor

The editor is available at [`/admin/`](./admin/). It uses Decap CMS's GitHub backend and editorial workflow: saving a new or edited post creates or updates a branch and pull request, and publishing from the editor merges that pull request into `main`. GitHub Pages then deploys the merged content.

Before using it, configure a GitHub OAuth application and deploy an OAuth proxy. Replace `YOUR-OAUTH-PROXY.example.com` in [`admin/config.yml`](./admin/config.yml) with that proxy's domain. Do not put a GitHub token or OAuth client secret in this repository or in browser JavaScript. A hosted Decap OAuth service or a small Cloudflare Worker OAuth proxy are suitable options.

Editors must fill in the Author fields for each post. GitHub authenticates the editor and records the pull-request author, but it does not automatically write that person's name into the post's front matter; the CMS therefore keeps explicit author metadata so every post renders its author consistently.
