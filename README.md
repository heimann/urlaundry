# [URLaundry](https://urlaundry.dmeh.net) 

A simple web tool for cleaning tracking parameters from URLs, making them more private and shareable.

## Features

- Instantly cleans URLs by removing unnecessary tracking parameters
- Preserves important parameters based on domain
- Automatically copies the cleaned URL to clipboard
- Shows how many parameters were removed
- Auto-detects URLs from clipboard on load

## Usage

1. Paste a URL into the input field
2. Click the "clean" button
3. Get your clean URL, automatically copied to clipboard

## Development

This project uses SolidJS with Vite and is built with Bun.

```bash
# Install dependencies
bun install

# Run development server
bun run dev

# Build for production
bun run build
```

## Deployment

This project is deployed on Cloudflare Pages.
