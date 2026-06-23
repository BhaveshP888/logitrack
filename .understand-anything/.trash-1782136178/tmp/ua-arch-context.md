# Architecture Context

## Language Context

### Language: css

# CSS Language Prompt Snippet

## Key Concepts

- **Selectors**: Element, class (`.name`), ID (`#name`), attribute (`[attr]`), and pseudo-class (`:hover`) targeting
- **Specificity**: Inline > ID > Class > Element cascade priority determining which rules win
- **Box Model**: `margin`, `border`, `padding`, `content` dimensions controlling element sizing
- **Flexbox**: `display: flex` with `justify-content`, `align-items` for one-dimensional layouts
- **Grid**: `display: grid` with `grid-template-columns/rows` for two-dimensional layouts
- **Custom Properties (Variables)**: `--name: value` with `var(--name)` for reusable design tokens
- **Media Queries**: `@media (max-width: ...)` for responsive design breakpoints
- **SCSS/Sass Features**: Nesting, `$variables`, `@mixin`, `@include`, `@extend`, `@use`, `@forward`
- **CSS Modules**: Scoped class names (`.module.css`) preventing global style collisions
- **Cascade Layers**: `@layer` for explicit control over cascade ordering

## Notable File Patterns

- `*.css` — Standard CSS stylesheets
- `*.scss` / `*.sass` — Sass/SCSS preprocessor files
- `*.less` — Less preprocessor files
- `*.module.css` / `*.module.scss` — CSS Modules (scoped styles)
- `globals.css` / `reset.css` / `normalize.css` — Global base styles
- `tailwind.config.js` — Tailwind CSS configuration (though a JS file)
- `variables.scss` / `_variables.scss` — Design token definitions

## Edge Patterns

- CSS files are `related` to the HTML or component files that import them for styling
- SCSS partial files (`_*.scss`) are `depends_on` by the main stylesheet that `@use`s them
- CSS variable definition files are `related` to all stylesheets that reference those variables
- CSS Modules are `related` to the component files that import them

## Summary Style

> "Global stylesheet defining CSS custom properties for the design system color palette and typography."
> "Responsive layout styles with flexbox and grid for the dashboard page across 3 breakpoints."
> "SCSS partial defining shared mixins for spacing, shadows, and media query breakpoints."


### Language: dockerfile

# Dockerfile Language Prompt Snippet

## Key Concepts

- **Multi-Stage Builds**: Multiple `FROM` statements to separate build and runtime stages, reducing image size
- **Layer Caching**: Each instruction creates a layer; order instructions from least to most frequently changing for cache efficiency
- **Base Images**: `FROM image:tag` selects the starting image; prefer slim/alpine variants for smaller images
- **COPY vs ADD**: `COPY` for local files (preferred), `ADD` for URLs and tar extraction
- **Build Arguments**: `ARG` for build-time variables, `ENV` for runtime environment variables
- **Health Checks**: `HEALTHCHECK` instruction for container orchestrator readiness probes
- **Entry Point vs CMD**: `ENTRYPOINT` sets the executable, `CMD` provides default arguments
- **User Permissions**: `USER` instruction to run as non-root for security
- **Ignore Patterns**: `.dockerignore` excludes files from the build context (like `.gitignore`)

## Notable File Patterns

- `Dockerfile` — Primary container image definition (at project root)
- `Dockerfile.dev` / `Dockerfile.prod` — Environment-specific Dockerfiles
- `docker-compose.yml` — Multi-container application orchestration
- `docker-compose.override.yml` — Local development overrides
- `.dockerignore` — Build context exclusion patterns

## Edge Patterns

- Dockerfile `deploys` the application entry point it packages (COPY/CMD target)
- docker-compose `depends_on` Dockerfile(s) it references for building
- Dockerfile `depends_on` package manifests (package.json, requirements.txt) it copies for dependency installation
- docker-compose services create `related` edges between co-deployed components

## Summary Style

> "Multi-stage Docker build producing a minimal Node.js production image with N build stages."
> "Docker Compose configuration orchestrating N services with shared networking and persistent volumes."
> "Development Dockerfile with hot-reload support and mounted source volumes."


### Language: html

# HTML Language Prompt Snippet

## Key Concepts

- **Semantic Elements**: `<main>`, `<nav>`, `<header>`, `<footer>`, `<article>`, `<section>` for meaningful structure
- **Document Structure**: `<!DOCTYPE html>`, `<html>`, `<head>`, `<body>` forming the page skeleton
- **Forms**: `<form>`, `<input>`, `<select>`, `<textarea>` for user data collection with validation attributes
- **Accessibility**: `aria-*` attributes, `role`, `alt` text, and semantic markup for screen readers
- **Meta Tags**: `<meta>` for viewport, charset, description, Open Graph, and SEO metadata
- **Script and Style Loading**: `<script>`, `<link>`, `<style>` for JavaScript and CSS inclusion
- **Data Attributes**: `data-*` custom attributes for storing element-specific data
- **Template Syntax**: Framework-specific templating (`{{ }}` for Jinja/Django, `<%= %>` for ERB)
- **Web Components**: `<template>`, `<slot>`, Custom Elements for encapsulated reusable components

## Notable File Patterns

- `index.html` — Application entry point or SPA shell
- `*.html` / `*.htm` — Static HTML pages
- `templates/**/*.html` — Server-side template files (Django, Jinja2, Go templates)
- `public/index.html` — SPA root document (React, Vue)
- `*.ejs` / `*.hbs` / `*.pug` — Templating engine files

## Edge Patterns

- HTML files `depends_on` JavaScript and CSS files they include via `<script>` and `<link>` tags
- Template HTML files `depends_on` the server-side code that renders them
- HTML entry points are `deploys` targets for build systems and web servers
- HTML files `related` to the components or routes they render

## Summary Style

> "Single-page application shell with viewport meta, CSS reset, and React root mount point."
> "Server-rendered template with navigation, content area, and footer using Django template inheritance."
> "Static landing page with responsive layout, form, and third-party script integrations."


### Language: javascript

# JavaScript Language Prompt Snippet

## Key Concepts

- **Closures**: Functions that capture variables from their enclosing lexical scope
- **Prototypes**: Prototype chain-based inheritance underlying all JavaScript objects
- **Promises**: Asynchronous value containers enabling `.then()` chaining and `async/await`
- **Event Loop**: Single-threaded concurrency model with microtask and macrotask queues
- **Destructuring**: Extract values from objects and arrays into distinct variables
- **Spread/Rest Operators**: `...` for expanding iterables or collecting remaining arguments
- **Proxies**: Meta-programming construct to intercept and customize object operations
- **Generators**: Functions using `function*` and `yield` for lazy iteration
- **Symbol**: Unique, immutable primitive used for non-string property keys
- **WeakMap/WeakSet**: Collections with weakly-held keys allowing garbage collection
- **Modules (ESM vs CJS)**: ES Modules use `import/export`; CommonJS uses `require/module.exports`

## Import Patterns

- `import { X } from 'module'` — ESM named import
- `const X = require('module')` — CommonJS require
- `import('module')` — dynamic import returning a Promise (code splitting)
- `export default X` / `export { X }` — ESM export forms

## File Patterns

- `index.js` — barrel file or directory entry point
- `.mjs` — explicitly ES Module files
- `.cjs` — explicitly CommonJS files
- `package.json` `"type"` field — sets default module system (`"module"` or `"commonjs"`)

## Common Frameworks

- **React** — Declarative UI with virtual DOM and component model
- **Vue** — Progressive framework with reactivity system and single-file components
- **Express** — Minimal and flexible Node.js web application framework
- **Next.js** — React framework for production with hybrid rendering
- **Svelte** — Compile-time framework that shifts work from runtime to build step

## Example Language Notes

> Closure captures outer `config` variable, providing encapsulated state without class
> overhead. The returned object's methods share access to the same `config` reference,
> forming a module pattern that was standard before ES Modules.
>
> When encountering `.mjs` vs `.cjs` extensions, the module system is determined by
> extension regardless of the `package.json` type field — useful in mixed codebases.


### Language: json

# JSON Language Prompt Snippet

## Key Concepts

- **Strict Syntax**: No trailing commas, no comments (unlike JSONC or JSON5), double-quoted strings only
- **Data Types**: Objects, arrays, strings, numbers, booleans, and null — no undefined or date types
- **Nested Structure**: Arbitrary nesting depth for hierarchical configuration or data
- **Schema Validation**: JSON Schema (`$schema` keyword) for validating structure and types
- **JSONC**: JSON with Comments variant used by VS Code, tsconfig.json, and other tooling
- **JSON5**: Extended JSON allowing comments, trailing commas, unquoted keys, and more
- **JSON Lines** (`.jsonl`): One JSON object per line for streaming data processing

## Notable File Patterns

- `package.json` — Node.js project manifest with dependencies, scripts, and metadata
- `tsconfig.json` — TypeScript compiler configuration (actually JSONC)
- `.eslintrc.json` — ESLint linting rules and configuration
- `*.schema.json` — JSON Schema definitions for validation
- `composer.json` — PHP Composer project manifest
- `appsettings.json` — .NET application configuration
- `manifest.json` — Browser extension or PWA manifest

## Edge Patterns

- `package.json` `configures` the build toolchain and defines project dependencies
- `tsconfig.json` `configures` TypeScript compilation for all `.ts` files
- JSON Schema files `defines_schema` for API request/response validation
- Config JSON files `configures` the runtime behavior of the application

## Summary Style

> "Node.js project manifest defining N dependencies, build scripts, and project metadata."
> "TypeScript compiler configuration enabling strict mode with path aliases for monorepo packages."
> "JSON Schema defining the request/response structure for the user API endpoint."


### Language: markdown

# Markdown Language Prompt Snippet

## Key Concepts

- **Heading Hierarchy**: `#` through `######` for document structure, with h1 as the title
- **Front Matter**: YAML metadata between `---` delimiters at the top of the file
- **Fenced Code Blocks**: Triple backticks with optional language identifier for syntax highlighting
- **Reference-Style Links**: `[text][ref]` with `[ref]: url` definitions, useful for repeated URLs
- **Tables**: Pipe-delimited columns with alignment markers (`:---`, `:---:`, `---:`)
- **Admonitions**: Blockquote-based callouts (`> **Note:**`, `> **Warning:**`) for emphasis
- **Task Lists**: `- [ ]` and `- [x]` for checklists in issue trackers and READMEs
- **HTML Embedding**: Raw HTML allowed inline for features Markdown does not support natively

## Notable File Patterns

- `README.md` — Project overview and entry point for new contributors (high-value)
- `CONTRIBUTING.md` — Contribution guidelines, code style, PR process
- `CHANGELOG.md` — Version history following Keep a Changelog or similar format
- `docs/**/*.md` — Documentation directory with guides, API references, tutorials
- `*.md` in source directories — Co-located documentation for modules or packages
- `ADR-*.md` or `adr/*.md` — Architecture Decision Records

## Edge Patterns

- Markdown files `documents` the code components they describe or reference
- Links to other `.md` files create `related` edges between documentation nodes
- Code block references mentioning file paths may imply `documents` edges to those files
- README files in subdirectories typically `documents` the module at that path

## Summary Style

> "Project overview documentation with N sections covering installation, usage, and API reference."
> "Architecture Decision Record documenting the choice of [technology] for [purpose]."
> "Contributing guide with code style rules, testing requirements, and pull request process."


### Language: sql

# SQL Language Prompt Snippet

## Key Concepts

- **DDL (Data Definition)**: `CREATE TABLE`, `ALTER TABLE`, `DROP TABLE` for schema management
- **DML (Data Manipulation)**: `SELECT`, `INSERT`, `UPDATE`, `DELETE` for data operations
- **Normalization**: Organizing tables to reduce redundancy through 1NF, 2NF, 3NF relationships
- **Foreign Keys**: `REFERENCES` constraints enforcing referential integrity between tables
- **Indexes**: `CREATE INDEX` for query performance optimization on frequently queried columns
- **Migrations**: Numbered, sequential schema changes applied in order for version control
- **Transactions**: `BEGIN`/`COMMIT`/`ROLLBACK` for atomic multi-statement operations
- **Views**: Named queries (`CREATE VIEW`) providing virtual tables for complex joins
- **Stored Procedures**: Server-side functions for encapsulating business logic in the database
- **Constraints**: `NOT NULL`, `UNIQUE`, `CHECK`, `DEFAULT` for data integrity rules

## Notable File Patterns

- `migrations/*.sql` — Numbered migration files (e.g., `001_create_users.sql`, `002_add_orders.sql`)
- `schema.sql` — Full database schema definition (often generated from migrations)
- `seeds/*.sql` — Seed data for development and testing environments
- `*.up.sql` / `*.down.sql` — Reversible migration pairs (up applies, down reverts)
- `init.sql` — Database initialization script for Docker or fresh setup
- `procedures/*.sql` — Stored procedure definitions

## Edge Patterns

- SQL migration files `migrates` the tables they create or alter
- Schema definition files `defines_schema` for the ORM models or data layer code that reads them
- Table definitions create implicit `related` edges between tables connected by foreign keys
- Seed files `depends_on` the migration files that create the tables they populate

## Summary Style

> "Database migration creating the users table with email, name, and authentication columns."
> "Schema definition with N tables covering user management, orders, and payment processing."
> "Seed data populating N tables with development fixtures for testing."


### Language: typescript

# TypeScript Language Prompt Snippet

## Key Concepts

- **Generics**: Parameterized types (`<T>`) enabling reusable, type-safe abstractions
- **Type Guards**: Runtime checks that narrow types within conditional blocks (`is`, `in`, `typeof`, `instanceof`)
- **Discriminated Unions**: Union types with a shared literal field used for exhaustive narrowing
- **Utility Types**: Built-in mapped types like `Partial<T>`, `Pick<T, K>`, `Omit<T, K>`, `Record<K, V>`
- **Interfaces vs Types**: Interfaces support declaration merging; type aliases support unions and mapped types
- **Enums**: Numeric and string enums for named constant sets; prefer `as const` objects when possible
- **Mapped Types**: Transform existing types property-by-property using `[K in keyof T]` syntax
- **Conditional Types**: `T extends U ? X : Y` for type-level branching logic
- **Template Literal Types**: String manipulation at the type level using backtick syntax
- **Declaration Merging**: Interfaces with the same name merge their members automatically
- **Module Augmentation**: Extending third-party module types via `declare module` blocks

## Import Patterns

- `import { X } from 'module'` — named import (most common)
- `import type { X } from 'module'` — type-only import (erased at runtime)
- `import * as X from 'module'` — namespace import
- `import X from 'module'` — default import

## File Patterns

- `index.ts` — barrel file re-exporting public API from a directory
- `*.d.ts` — type declaration files (ambient declarations, no runtime code)
- `tsconfig.json` — TypeScript compiler configuration and project references
- `*.tsx` — TypeScript files containing JSX (React components)

## Common Frameworks

- **React** — UI component library with hooks and JSX
- **Angular** — Full-featured framework with decorators and dependency injection
- **Next.js** — React meta-framework with SSR, SSG, and API routes
- **NestJS** — Server-side framework inspired by Angular (decorators, modules, DI)
- **Express (with TS)** — Minimal HTTP framework with typed request/response handlers

## Example Language Notes

> Uses generic type parameter `T extends BaseEntity` to ensure type safety across
> repository methods. The constraint guarantees all entities share a common `id` field
> while allowing specific entity types to flow through the data layer without casting.
>
> Barrel files (`index.ts`) re-export symbols so consumers import from the directory
> rather than reaching into internal module paths — maintaining encapsulation.


### Language: yaml

# YAML Language Prompt Snippet

## Key Concepts

- **Indentation-Based Nesting**: Whitespace-sensitive structure (spaces only, no tabs) defining hierarchy
- **Anchors and Aliases**: `&anchor` defines a reusable block, `*anchor` references it to avoid duplication
- **Merge Keys**: `<<: *anchor` merges anchor contents into the current mapping
- **Multi-Line Strings**: Literal block (`|`) preserves newlines, folded block (`>`) joins lines
- **Document Separators**: `---` starts a new document, `...` ends one (multi-document streams)
- **Tags and Types**: `!!str`, `!!int`, `!!bool` for explicit typing; custom tags for application-specific types
- **Flow Style**: Inline JSON-like syntax `{key: value}` and `[item1, item2]` for compact notation
- **Environment Variable Substitution**: `${VAR}` patterns used in docker-compose and CI configs

## Notable File Patterns

- `docker-compose.yml` / `docker-compose.yaml` — Multi-container Docker application definition
- `.github/workflows/*.yml` — GitHub Actions CI/CD workflow definitions
- `.gitlab-ci.yml` — GitLab CI/CD pipeline configuration
- `kubernetes/*.yaml` / `k8s/*.yaml` — Kubernetes resource manifests
- `*.config.yaml` — Application configuration files
- `mkdocs.yml` — MkDocs documentation site configuration
- `serverless.yml` — Serverless Framework configuration

## Edge Patterns

- YAML config files `configures` the code modules they control (e.g., database settings affect data layer)
- CI/CD YAML files `triggers` build and deployment pipelines
- docker-compose YAML `deploys` services and `depends_on` Dockerfiles
- Kubernetes YAML `deploys` and `provisions` application services

## Summary Style

> "Docker Compose configuration defining N services with networking, volumes, and health checks."
> "GitHub Actions workflow running tests on push and deploying to production on merge to main."
> "Kubernetes deployment manifest with N replicas, resource limits, and liveness probes."


## Framework Context

### Framework: express

# Express Framework Addendum

> Injected into file-analyzer and architecture-analyzer prompts when Express is detected.
> Do NOT use as a standalone prompt — always appended to the base prompt template.

## Express Project Structure

When analyzing an Express project, apply these additional conventions on top of the base analysis rules.

### Canonical File Roles

| File / Pattern | Role | Tags |
|---|---|---|
| `app.js`, `app.ts` | Application entry point — creates Express app, mounts middleware and routes | `entry-point`, `config` |
| `server.js`, `server.ts`, `index.js`, `index.ts` | Server bootstrap — starts HTTP listener, may import app | `entry-point`, `config` |
| `routes/*.js`, `routes/*.ts` | Route definitions — map HTTP methods and paths to handlers | `api-handler`, `routing` |
| `controllers/*.js`, `controllers/*.ts` | Request handlers — process requests, orchestrate services, return responses | `api-handler`, `service` |
| `models/*.js`, `models/*.ts` | Data models — Mongoose schemas, Sequelize models, or plain data definitions | `data-model` |
| `middleware/*.js`, `middleware/*.ts` | Middleware functions — authentication, logging, validation, error handling | `middleware` |
| `services/*.js`, `services/*.ts` | Business logic — domain operations decoupled from HTTP layer | `service` |
| `db/*.js`, `db/*.ts`, `database/*.js` | Database connection and configuration | `data-model`, `config` |
| `config/*.js`, `config/*.ts` | Application configuration — environment variables, feature flags | `config` |
| `validators/*.js`, `validators/*.ts` | Request validation schemas (Joi, Zod, express-validator) | `validation`, `utility` |
| `utils/*.js`, `utils/*.ts` | Shared utility functions | `utility` |
| `tests/*.js`, `test/*.js`, `__tests__/*.js` | Unit and integration tests | `test` |

### Edge Patterns to Look For

**Route mounting** — When `app.use('/api/users', usersRouter)` mounts a router, create `depends_on` edges from the main app to the router module. These edges represent the HTTP routing tree.

**Middleware chain** — When `app.use(cors())`, `app.use(authMiddleware)`, or `router.use(validate)` registers middleware, create middleware edges from the app or router to the middleware function. Order matters — middleware executes in registration order.

**Controller-to-service calls** — When a controller imports and calls a service function, create `depends_on` edges from the controller to the service. This represents the separation between HTTP handling and business logic.

**Model relationships** — When models reference each other (Mongoose `ref`, Sequelize associations), create `depends_on` edges between model files with descriptions indicating the relationship type.

### Architectural Layers for Express

Assign nodes to these layers when detected:

| Layer ID | Layer Name | What Goes Here |
|---|---|---|
| `layer:api` | API Layer | `routes/`, `controllers/`, request validators |
| `layer:data` | Data Layer | `models/`, `db/`, migration files, seeders |
| `layer:service` | Service Layer | `services/`, business logic modules |
| `layer:middleware` | Middleware Layer | `middleware/`, error handlers, authentication, logging |
| `layer:config` | Config Layer | `app.js`, `config/`, environment setup, `server.js` |
| `layer:utility` | Utility Layer | `utils/`, `helpers/`, shared pure functions |
| `layer:test` | Test Layer | `tests/`, `__tests__/`, `*.test.js`, `*.spec.js` |

### Notable Patterns to Capture in languageLesson

- **Middleware chain (req, res, next)**: Express processes requests through a pipeline of middleware functions — each receives the request, response, and a `next()` callback to pass control forward
- **Error-handling middleware (4 params)**: Middleware with signature `(err, req, res, next)` catches errors — must be registered after all routes to act as a global error handler
- **Router modularity**: `express.Router()` creates modular, mountable route handlers that can be composed into the main app at different path prefixes
- **MVC pattern**: Express apps commonly separate concerns into Models (data), Views (response formatting), and Controllers (request handling)
- **Body parsing and validation**: Request body parsing (`express.json()`, `express.urlencoded()`) and validation (Joi, Zod, express-validator) are middleware concerns applied before route handlers


### Framework: react

# React Framework Addendum

> Injected into file-analyzer and architecture-analyzer prompts when React is detected.
> Do NOT use as a standalone prompt — always appended to the base prompt template.

## React Project Structure

When analyzing a React project, apply these additional conventions on top of the base analysis rules.

### Canonical File Roles

| File / Pattern | Role | Tags |
|---|---|---|
| `src/App.tsx` | Root application component — mounts providers, router, and top-level layout | `entry-point`, `ui` |
| `components/*.tsx`, `components/**/*.tsx` | Reusable UI components | `ui` |
| `hooks/*.ts`, `hooks/*.tsx` | Custom React hooks — encapsulate reusable stateful logic | `service`, `utility` |
| `contexts/*.tsx`, `context/*.tsx` | React Context providers and consumers — shared state across component tree | `service`, `state` |
| `pages/*.tsx`, `views/*.tsx` | Page-level components mapped to routes | `ui`, `routing` |
| `utils/*.ts`, `helpers/*.ts` | Pure utility functions — formatting, validation, transformations | `utility` |
| `types/*.ts`, `types/*.d.ts` | TypeScript type definitions and interfaces | `type-definition` |
| `services/*.ts`, `api/*.ts` | API client functions and data-fetching logic | `service` |
| `store/*.ts`, `slices/*.ts` | State management (Redux, Zustand, etc.) | `service`, `state` |
| `constants/*.ts` | Application-wide constants and enums | `config` |
| `__tests__/*.tsx`, `*.test.tsx`, `*.spec.tsx` | Unit and integration tests | `test` |

### Edge Patterns to Look For

**Component composition** — When a parent component renders a child component in its JSX return, create `contains` edges from the parent to the child. These edges represent the component tree hierarchy.

**Hook usage** — When a component or hook imports and calls a custom hook (`useX`), create `depends_on` edges from the consumer to the hook module. Hooks are the primary mechanism for shared logic in React.

**Context provider/consumer** — When a Context provider wraps components, create `publishes` edges from the provider to the context definition. When components call `useContext` or use a custom context hook, create `subscribes` edges from the consumer to the context.

**Props drilling chains** — When props are passed through multiple component layers without being used, create `depends_on` edges along the chain to surface the coupling depth.

### Architectural Layers for React

Assign nodes to these layers when detected:

| Layer ID | Layer Name | What Goes Here |
|---|---|---|
| `layer:ui` | UI Layer | `components/`, `pages/`, `views/`, layout components |
| `layer:service` | Service Layer | `hooks/`, `contexts/`, `services/`, `api/`, `store/` |
| `layer:types` | Types Layer | `types/`, shared TypeScript interfaces and type definitions |
| `layer:utility` | Utility Layer | `utils/`, `helpers/`, pure functions |
| `layer:config` | Config Layer | `App.tsx`, router configuration, provider setup, constants |
| `layer:test` | Test Layer | `__tests__/`, `*.test.tsx`, `*.spec.tsx` |

### Notable Patterns to Capture in languageLesson

- **Component composition over inheritance**: React favors composing components via props and children rather than class inheritance hierarchies
- **Custom hooks for reusable logic**: Hooks prefixed with `use` extract stateful logic into shareable modules without changing the component tree
- **React.memo for performance**: Components wrapped in `React.memo` skip re-renders when props are unchanged — indicates performance-sensitive paths
- **Controlled vs. uncontrolled components**: Controlled components derive state from props; uncontrolled components manage internal state via refs
- **Render props pattern**: Components that accept a function as children or a render prop to delegate rendering decisions to the consumer


