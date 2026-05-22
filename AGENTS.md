# AI Agents Guide

This document provides context for AI agents (like GitHub Copilot, Cursor, Windsurf, or custom LLM-based tools) working on the Tymber framework.

## Project Structure

Tymber is a monorepo containing the framework's core and several modules.

- `packages/`: Contains the framework's core and official modules.
- `docs/`: Documentation for the framework.
- `examples/`: Example applications using Tymber.

## Reference Implementation

If you are looking for a complete, idiomatic example of how to build an application with Tymber, please refer to:

**[examples/single-module-app](./examples/single-module-app)**

This example demonstrates:
- Module definition and registration.
- Endpoint implementation (CRUD).
- Repository pattern with database interactions.
- View rendering with templates and i18n.
- Unit and integration testing.
- Project structure and configuration.

Use this example as your primary source of truth for understanding how the different parts of Tymber work together.
