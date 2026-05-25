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
| `PATCH` | `/api/vehicles/:id/status` | Admin approve/reject/sold (`{ status: "VERIFIED" \| "REJECTED" \| "PENDING" \| "SOLD" }`) |
| `PATCH` | `/api/seller/vehicles/:id/mark-sold` | Seller/Bank partner marks own `PENDING`/`VERIFIED` listing as `SOLD` |
| `GET` | `/api/users` | List users (supports `?phone=`) |
| `POST` | `/api/users` | Upsert user by phone + role |
| `POST` | `/api/uploads` | Upload vehicle photos (`multipart/form-data`, field name: `files`) |

Uploaded files are stored in Supabase Storage and `/api/uploads` returns public Supabase URLs that are saved directly in vehicle media fields.



Create a `.env.local` file (or copy from `.env.example`) with:

```bash
NEXT_PUBLIC_MSG91_WIDGET_ID=366579704a4f393038343731
MSG91_AUTH_KEY=your_msg91_auth_key
MSG91_WIDGET_TOKEN=your_msg91_widget_token
ADMIN_PHONE_NUMBERS=+1XXXXXXXXXX,+91XXXXXXXXXX
```

Seller/admin login now uses the MSG91 OTP widget:

- Client loads `https://verify.msg91.com/otp-provider.js` with fallback to `https://verify.phone91.com/otp-provider.js` from `/auth/login` or `/admin/login`
- Widget success callback posts `{ accessToken, phone }` to `POST /api/auth/msg91/verify`
- Server verifies the MSG91 access token, creates/loads the user, and sets the existing RepoMandi session cookie

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
