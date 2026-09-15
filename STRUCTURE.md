# Dev-X Book Store — Project Structure

```text
Dev-X Book Store
├── backend
│   ├── database
│   │   ├── db-check.js
│   │   ├── schema.postgres.sql
│   │   └── seed.json
│   ├── tests
│   │   ├── smoke.js
│   │   └── security.js
│   └── server.js
│
├── frontend
│   ├── css
│   │   └── style.css
│   ├── js
│   │   └── main.js
│   ├── index.html
│   └── payment-result.html
│
├── Dockerfile
├── docker-compose.yml
├── docker-compose.prod.yml
├── render.yaml
├── Caddyfile
├── package.json
├── README.md
├── DEPLOYMENT.md
├── .env.example
└── .gitignore
```

The CSS is separated into `frontend/css/style.css`, frontend JavaScript into `frontend/js/main.js`, and database files are grouped under `backend/database`.
