# Nurse Care Backend

Plain Java (`com.sun.net.httpserver.HttpServer`, no framework) REST API backed by
a cloud PostgreSQL database (e.g. Neon).

## Configuration

Connection details come from environment variables:

| Variable | Purpose | Local dev default |
|---|---|---|
| `DATABASE_URL` | JDBC URL, e.g. `jdbc:postgresql://host:5432/dbname` | `jdbc:postgresql://localhost:5432/nursecare` |
| `DATABASE_USER` | Database username | `postgres` |
| `DATABASE_PASSWORD` | Database password | `postgres` |

## Run it

```
mvn clean package
java -jar target/nurse-care-backend.jar
```

On first run it creates all tables and seeds the same 24 demo nurses plus the
demo admin/member accounts (`admin@hospital.com` / `Admin@1234`,
`member@hospital.com` / `Member@1234`) if they don't already exist.

By default listens on port `8080`, or the value of the `PORT` environment
variable if set (used by most cloud hosts, which assign a port dynamically).

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/nurses` | List all nurses |
| GET | `/api/nurses/{id}` | Get one nurse |
| POST | `/api/nurses` | Add a nurse |
| PUT | `/api/nurses/{id}` | Update a nurse |
| DELETE | `/api/nurses/{id}` | Delete a nurse |
| POST | `/api/auth/admin/signup` | Create an admin account |
| POST | `/api/auth/admin/login` | Admin login |
| POST | `/api/auth/member/signup` | Create a member account |
| POST | `/api/auth/member/login` | Member login |
| GET | `/api/bookings` | List all bookings |
| POST | `/api/bookings` | Create a booking |
| PUT | `/api/bookings/{id}` | Update booking status (e.g. cancel) |
| GET | `/api/contact` | List contact messages |
| POST | `/api/contact` | Submit a contact message |

Admin signup requires `inviteCode: "ADMIN2026"` in the request body.

CORS is open (`Access-Control-Allow-Origin: *`) for development — restrict this
before any real deployment.
