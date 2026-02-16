# Database migrations

Tymber provides a lightweight database migrations system, allowing you to easily manage database schema changes over time.

## File structure

Translations are stored in the `assets/migrations` directory of your module with a `.sql` extension:

```text
my-module/
├── assets/
│   ├── i18n/
// highlight-next-line              
│   ├── migrations/        
│   ├── static/
│   └── templates/       
├── src/
│   ├── admin-endpoints/    
│   ├── admin-views/        
│   ├── endpoints/          
│   ├── repositories/       
│   ├── services/           
│   ├── utils/              
│   └── views/              
└── test/        
```

Example:

- `assets/migrations/001-create-users-table.sql`
- `assets/migrations/002-add-user-field.sql`

Each migration file must follow the following naming convention:

`<id>-<name>.sql`

where:

- `id`: a unique (per module) integer identifying the migration's order (e.g., `001`, `002`).
- `name`: a descriptive name for the migration.

## Execution

Migrations are executed:

- when the [`App`](../building-blocks/app.md) starts
- sequentially
- within a transaction (if a migration fails, the changes are rolled back, and the application startup will fail)
