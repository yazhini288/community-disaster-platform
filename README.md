# Community Disaster Management & Resource Allocation Platform

Full MERN stack project: React (Vite) frontend + Node/Express backend + MongoDB Atlas.

## Folder structure

```
community-disaster-platform/
  backend/    Express API, MongoDB models, JWT auth
  frontend/   React app (Vite), React-Leaflet map, forms
```

## 1. Backend setup

```
cd backend
npm install
cp .env.example .env
```

Edit `.env` and fill in:
```
PORT=5000
MONGO_URI=your_mongodb_atlas_connection_string
JWT_SECRET=any_long_random_string
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
```

Run it:
```
npm run dev
```

Visit `http://localhost:5000/api/health` — you should see `{"status":"ok"}`.

## 2. Frontend setup

```
cd frontend
npm install
cp .env.example .env
```

`.env` should have:
```
VITE_API_URL=http://localhost:5000/api
```

Run it:
```
npm run dev
```

Visit `http://localhost:5173`.

## 3. Using the app

1. Register a new account (check "needs special assistance" if applicable).
2. Submit a disaster/road-status report — it will show up on the Map page with a marker.
3. Submit a resource request — mark vulnerability tags if relevant.
4. To test the admin panel: manually change a user's `role` field to `"admin"` in MongoDB Atlas (Data Explorer → your database → users collection), then log back in. Admins can approve/reject requests and see inventory.

## 4. API overview

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | /api/auth/register | - | Create account |
| POST | /api/auth/login | - | Login, get JWT |
| GET | /api/reports | - | List disaster/road reports |
| POST | /api/reports | required | Submit a report |
| GET | /api/requests | required | List resource requests |
| POST | /api/requests | required | Submit a request |
| PUT | /api/requests/:id | required | Update status (admin use) |
| GET | /api/resources | - | List inventory |
| POST | /api/resources | admin | Add inventory item |

## 5. Deployment

- Frontend → Vercel or Netlify (set `VITE_API_URL` to your deployed backend URL)
- Backend → Render or Railway (set the same env vars as your local `.env`)
- Database → MongoDB Atlas (already cloud-hosted, no change needed)
