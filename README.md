# ASP.NET + React Template

Start template including ASP.NET Api with controllers and a React/Typescript app built by Vite.  

Using the .NET Api as a single host for both backend and frontend.  

## Local development database

Start PostgreSQL with Docker:

```bash
docker compose up -d postgres
```

The server uses this development connection string:

```text
Host=localhost;Port=5432;Database=aspnetreacttemplate;Username=postgres;Password=postgres;Include Error Detail=true
```

Copy `.env.example` to `.env` if you want to keep the connection string in a file that `Program.cs` loads automatically.
