# Available commands
default:
    @just --list

# Start the development server
dev:
    bun run dev

# Build for production
build:
    bun run build

# Preview the production build
preview:
    bun run preview