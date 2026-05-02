# Apex Local Super-App

Hyperlocal booking platform for salons, street food & health centres in Tier 2/3 Indian cities.

---

## Project Structure

```
apex-app/
├── backend/          FastAPI Python backend
│   ├── app/
│   │   ├── core/     config, JWT, dependencies
│   │   ├── models/   SQLAlchemy database models
│   │   ├── routers/  API endpoints
│   │   ├── schemas/  Pydantic request/response schemas
│   │   ├── services/ OTP, WhatsApp, slot calculation
│   │   ├── database.py
│   │   └── main.py
│   ├── requirements.txt
│   └── .env.example
└── frontend/         React.js frontend
    ├── src/
    │   ├── layouts/  CustomerLayout, OwnerLayout, AdminLayout
    │   ├── pages/    auth/, customer/, owner/, admin/
    │   ├── services/ API calls (axios)
    │   └── store/    Zustand auth store
    ├── package.json
    └── .env.example
```

---

## Three Separate Login Flows

| Portal    | URL              | Auth Method          | Role    |
|-----------|------------------|----------------------|---------|
| Customer  | `/login`         | Phone OTP (WhatsApp) | customer|
| Owner     | `/owner/login`   | Email + Password     | owner   |
| Admin     | `/admin/login`   | Email + Password     | admin   |

---

## Local Setup

### Backend

```bash
cd backend
cp .env.example .env        # fill in your keys
pip install -r requirements.txt
uvicorn app.main:app --reload
# API docs: http://localhost:8000/docs
```

### Frontend

```bash
cd frontend
cp .env.example .env
npm install
npm run dev
# App: http://localhost:5173
```

### Required services (local dev)
- PostgreSQL 15 running on localhost:5432
- Redis running on localhost:6379
- MongoDB running on localhost:27017

Or use Docker:
```bash
docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=password postgres:15
docker run -d -p 6379:6379 redis:7
docker run -d -p 27017:27017 mongo:7
```

---

## API Endpoints

### Customer Auth
- `POST /auth/send-otp`     — send WhatsApp OTP
- `POST /auth/verify-otp`   — verify + get JWT
- `POST /auth/refresh`      — refresh tokens
- `GET  /auth/me`           — current user

### Owner Auth
- `POST /owner/auth/register` — register business owner
- `POST /owner/auth/login`    — email + password login

### Admin Auth (Founder)
- `POST /admin/auth/login`    — secure admin login
- `POST /admin/auth/create`   — create new admin account

### Shops
- `GET  /shops`               — list active shops
- `GET  /shops/:id`           — shop profile
- `POST /shops`               — register shop (owner)
- `PUT  /shops/:id`           — update shop
- `GET  /shops/:id/slots`     — available slots for a date
- `GET  /shops/:id/services`  — list services
- `POST /shops/:id/services`  — add service

### Bookings
- `POST /bookings`            — create booking
- `GET  /bookings/my`         — customer's bookings
- `GET  /bookings/shop/:id`   — owner's bookings
- `PATCH /bookings/:id/status`— confirm/complete/cancel
- `POST /bookings/:id/review` — submit review

### Payments
- `POST /payments/create-order` — Razorpay order
- `POST /payments/verify`       — signature verification

### Analytics (Owner)
- `GET /analytics/overview`   — today's stats
- `GET /analytics/revenue`    — revenue chart
- `GET /analytics/popular`    — top services + peak hours

### Admin Panel
- `GET  /admin/shops/pending`       — pending approvals
- `POST /admin/shops/:id/approve`   — approve shop
- `POST /admin/shops/:id/suspend`   — suspend shop
- `GET  /admin/users`               — all users
- `GET  /admin/stats`               — platform stats
- `GET  /admin/analytics/revenue`   — platform revenue

---

## Environment Variables

See `backend/.env.example` for the complete list of 16 required variables.
Key ones:
- `DATABASE_URL` — PostgreSQL connection
- `JWT_SECRET_KEY` — generate with `openssl rand -hex 32`
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — WhatsApp OTP
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — payments

---

## Next Steps (Frontend pages to build out)
- [ ] `customer/Home.jsx` — search, browse salons by area
- [ ] `customer/ShopProfile.jsx` — photos, services, slot picker
- [ ] `customer/BookingFlow.jsx` — 3-step booking wizard
- [ ] `customer/Dashboard.jsx` — upcoming/past bookings
- [ ] `owner/Bookings.jsx` — kanban-style booking management
- [ ] `owner/Services.jsx` — add/edit/toggle services
- [ ] `owner/Schedule.jsx` — weekly hours + block dates
- [ ] `owner/Analytics.jsx` — revenue charts (Recharts)
- [ ] `admin/Shops.jsx` — full shop management table
- [ ] `admin/Analytics.jsx` — platform revenue chart
