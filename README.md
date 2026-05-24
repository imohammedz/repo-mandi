This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Database setup (PostgreSQL via Drizzle ORM)

Copy `.env.example` to `.env.local` and fill in your connection string:

```bash
DATABASE_URL=postgresql://user:password@host:5432/dbname
```

Works with any PostgreSQL provider: [Neon](https://neon.tech), [Supabase](https://supabase.com), local Postgres, etc.

### Apply schema

```bash
# Push schema directly to your database (recommended for development)
npm run db:push

# Or generate + apply a migration file
npm run db:generate
npm run db:migrate
```

### Available REST endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/vehicles` | List all vehicles (supports `?type=&state=&q=`) |
| `POST` | `/api/vehicles` | Create a vehicle listing |
| `GET` | `/api/vehicles/:id` | Get a single vehicle |
| `PUT` | `/api/vehicles/:id` | Update a vehicle |
| `DELETE` | `/api/vehicles/:id` | Delete a vehicle |
| `PATCH` | `/api/vehicles/:id/status` | Admin approve/reject (`{ status: "VERIFIED" \| "REJECTED" \| "PENDING" \| "SOLD" }`) |
| `GET` | `/api/users` | List users (supports `?phone=`) |
| `POST` | `/api/users` | Upsert user by phone + role |
| `POST` | `/api/uploads` | Upload vehicle photos (`multipart/form-data`, field name: `files`) |

Uploaded files are saved in `public/uploads` (ignored by git), and vehicle deletion cleans up linked uploaded images.



Create a `.env.local` file (or copy from `.env.example`) with:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_twilio_auth_token
TWILIO_VERIFY_SERVICE_SID=VAxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
ADMIN_PHONE_NUMBERS=+1XXXXXXXXXX,+91XXXXXXXXXX
```

The app sends and verifies OTP via:

- `POST /api/auth/otp/send`
- `POST /api/auth/otp/verify`

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
