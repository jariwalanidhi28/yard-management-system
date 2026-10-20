# Enterprise Yard Management System (YMS)

A complete, production-grade **Yard Management System (YMS)** built with the **MERN** stack (MongoDB, Express.js, React+Vite, Node.js).

This system provides comprehensive control and visibility over logistics yards, gate check-in/check-out operations, interactive visual parking slot allocations, loading/unloading dock appointments with strict concurrency control, end-to-end shipment milestone tracking, live database statistics, and formula-injection-safe CSV analytics reports.

---

## 1. System Architecture & Features

### Core Modules
1. **Authentication & Role-Based Access Control (RBAC)**
   - Roles: `admin` and `staff`.
   - Secure HTTP-only cookies with SameSite/Secure attributes and Authorization Bearer header support.
   - Centralized authentication and role authorization middleware.
   - Staff account lifecycle management (create, update, activate, deactivate, password change).
   - Inactive user enforcement across all endpoints.

2. **Gate Entry & Exit Management**
   - Vehicle check-in with automatic sequential gate pass generation (`GP-YYYYMMDD-XXXX`).
   - Server-enforced entry and exit timestamps.
   - Prevents vehicles from having more than one active yard visit.
   - Prevents double gate exits.
   - Turnaround duration tracking.
   - Printable gate passes formatted for security gate booths.

3. **Yard Parking & Zone Management**
   - Yard zones and customizable parking slot types (`Standard`, `Oversized`, `Reefer`, `Hazmat`, `Staging`).
   - Interactive, color-coded visual yard grid (`Available`, `Occupied`, `Blocked`).
   - Concurrency-safe atomic slot allocation and reassignment.
   - Automatic slot release upon gate exit.
   - Immutable audit log of all yard vehicle movements (`YardMovement`).

4. **Dock Management & Appointment Scheduling**
   - Inbound, outbound, and dual dock bay directories.
   - Maintenance status checking to prevent booking disabled docks.
   - Concurrency-safe scheduling preventing overlapping appointment intervals on the same dock.
   - Validation that appointment end time is strictly after start time.
   - Operation lifecycle tracking (`Scheduled` → `In Progress` → `Completed`).
   - Overdue appointment detection.

5. **Shipment Management & Milestone Tracking**
   - Automated tracking number generation (`TRK-YYYYMMDD-XXXX`).
   - Validation of state transitions (`Created` → `Arrived` → `Loading` / `Unloading` → `In Transit` → `Delivered`).
   - Terminal state protection for delivered or cancelled freight.
   - Chronological event timeline recording authenticated staff IDs and timestamps.
   - Public tracking endpoint (`/track/:trackingNumber`) with restricted view omitting internal operational details.

6. **Real-Time Operations Dashboard**
   - 100% computed from live database records (zero mock data).
   - Dynamic 7-day movement trend chart (Recharts).
   - Real-time yard utilization calculation (usable slots denominator).
   - Critical alerts for expiring/expired driver commercial licenses and overdue dock appointments.

7. **Reports & Safe CSV Analytics**
   - Turnaround time metrics.
   - Usable yard slot occupancy and utilization.
   - Dock bay throughput and operational schedules.
   - Driver compliance and gate visit frequency.
   - CSV export protected against Spreadsheet Formula Injection (`=`, `+`, `-`, `@`, `\t`, `\r`).

---

## 2. Technology Stack

- **Backend**: Node.js, Express.js (REST API v1)
- **Database**: MongoDB with Mongoose ODM
- **Frontend**: React 18, Vite, React Router v6
- **Styling**: Bootstrap 5, Custom CSS, Responsive Flexbox & Grid
- **Icons**: Lucide React
- **Data Visualization**: Recharts
- **Toast Notifications**: React Hot Toast
- **HTTP Client**: Axios with credentials & automatic CSRF header handling
- **Security**: Helmet, CORS, express-rate-limit, cookie-parser, bcryptjs, jsonwebtoken, formula injection sanitizer
- **Testing**: Vitest, Supertest, React Testing Library, JSDOM

---

## 3. Monorepo Project Structure

```
yard-management-system/
├── backend/
│   ├── config/
│   │   ├── constants.js          # Shared enums and constants
│   │   └── db.js                 # Database connection & transaction abstraction
│   ├── controllers/              # REST controllers
│   ├── middleware/
│   │   ├── auth.js               # JWT cookie/header protection
│   │   ├── csrf.js               # Double-submit CSRF protection
│   │   ├── errorHandler.js       # Centralized error handler
│   │   ├── rateLimiter.js        # Global & Auth rate limiters
│   │   ├── roles.js              # Role-based access control
│   │   └── validate.js           # express-validator result checker
│   ├── models/                   # 11 Mongoose database models
│   ├── routes/                   # Express routes mounted under /api/v1
│   ├── scripts/
│   │   └── seed.js               # Development database seeding script
│   ├── services/                 # Business logic, transactions & concurrency
│   ├── tests/
│   │   ├── api.test.js           # Backend integration tests
│   │   └── setup.js              # Vitest test database lifecycle
│   ├── utils/
│   │   ├── AppError.js           # Custom operational error class
│   │   ├── csvHelper.js          # CSV export with formula injection escaping
│   │   └── jwt.js                # Token generator & cookie dispatcher
│   ├── app.js                    # Express application configuration
│   ├── server.js                 # Server entrypoint
│   ├── package.json
│   ├── vitest.config.js
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/           # 13 reusable UI components
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Authentication context & hooks
│   │   ├── layouts/
│   │   │   └── MainLayout.jsx    # Responsive sidebar & navbar shell
│   │   ├── pages/                # 13 application views
│   │   ├── services/
│   │   │   └── api.js            # Axios client with interceptors
│   │   ├── test/
│   │   │   ├── components.test.jsx
│   │   │   └── setup.js
│   │   ├── App.jsx               # Application routes
│   │   ├── index.css             # Bootstrap & custom logistics CSS
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
├── package.json                  # Root monorepo orchestrator
├── .gitignore
└── README.md
```

---

## 4. Setup and Installation

### Prerequisites
- **Node.js**: v18+ (tested on Node v26.5 / npm v11)
- **MongoDB**: Local MongoDB Community Server (port 27017) or MongoDB Atlas cluster.

> [!NOTE]
> **MongoDB Transactions & Replica Sets**:
> Multi-document MongoDB transactions (`session.startTransaction()`) require a replica set or MongoDB Atlas. The application includes an intelligent `withTransaction` abstraction in `backend/config/db.js` that automatically detects replica set availability. When running on standalone local instances (single mongod without replica set), it automatically executes with atomic field updates and referential verification.

### Step 1: Install Dependencies

From the project root:
```bash
npm.cmd run install:all
```
*(Or install individually inside `/backend` and `/frontend` using `npm install`)*

---

## 5. Environment Configuration

### Backend (`backend/.env`)
Create `backend/.env` (a pre-configured `.env.example` is provided):
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/yms_db
MONGODB_TEST_URI=mongodb://127.0.0.1:27017/yms_test_db
JWT_SECRET=super_secret_jwt_key_yms_development_change_in_production_123456789
JWT_EXPIRES_IN=1d
COOKIE_SECRET=super_secret_cookie_key_yms_change_in_production_987654321
CLIENT_URL=http://localhost:5173
ADMIN_DEFAULT_EMAIL=admin@yms.local
ADMIN_DEFAULT_PASSWORD=Admin@123456
ADMIN_DEFAULT_NAME=System Administrator
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX=500
AUTH_RATE_LIMIT_MAX=20
```

### Frontend (`frontend/.env`)
Create `frontend/.env`:
```env
VITE_API_URL=/api/v1
VITE_APP_NAME=Yard Management System
```

---

## 6. Database Seeding & Demo Accounts

Run the safe seeding script to populate the development database with realistic initial data:

```bash
npm.cmd run seed
```

This seeds:
- 1 Administrator account
- 2 Staff accounts
- Sample vehicles across different capacity classes
- Verified drivers with license validity dates (including 1 expiring soon and 1 expired for alert demonstration)
- Yard zones (`ZONE-A`, `ZONE-B`, `ZONE-C`) and parking slots (`Standard`, `Reefer`, `Blocked`)
- Active and maintenance docks
- Active and historical gate visits with turnaround data
- Scheduled dock appointments
- Shipments with chronological milestone events.

### Development Demo Credentials
| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@yms.local` | `Admin@123456` |
| **Staff 1** | `staff1@yms.local` | `Staff@123456` |
| **Staff 2** | `staff2@yms.local` | `Staff@123456` |

---

## 7. Running the Application

### Start Backend API Server
```bash
npm.cmd run start:backend
# API running at http://localhost:5000
# Health check: http://localhost:5000/api/health
```

### Start Frontend Client
```bash
npm.cmd run start:frontend
# Client running at http://localhost:5173
```

### Build Frontend for Production
```bash
npm.cmd run build:frontend
```

---

## 8. Automated Testing

The codebase includes comprehensive automated tests covering authentication, authorization, gate workflows, concurrency, overlap prevention, status transitions, report computations, and frontend UI components.

### Run Backend API Tests (27 Integration Tests)
```bash
npm.cmd run test:backend
```

### Run Frontend Component Tests (12 Unit Tests)
```bash
npm.cmd run test:frontend
```

**Total Automated Tests:** 39 tests passing cleanly.

---

## 9. API Reference (`/api/v1`)

### Authentication
- `POST /api/v1/auth/login` - Authenticate user & issue HTTP-only cookie.
- `POST /api/v1/auth/logout` - Clear session cookies.
- `GET /api/v1/auth/me` - Get profile of authenticated user.
- `POST /api/v1/auth/change-password` - Change user password.
- `GET /api/v1/auth/csrf-token` - Retrieve CSRF protection token.

### Staff Management (Admin Only)
- `GET /api/v1/staff` - List all staff accounts.
- `POST /api/v1/staff` - Create staff member.
- `GET /api/v1/staff/:id` - Get staff member details.
- `PATCH /api/v1/staff/:id` - Update staff member or toggle active status.
- `DELETE /api/v1/staff/:id` - Delete staff member (prevents deleting self).

### Vehicles
- `GET /api/v1/vehicles` - Paginated vehicles with search & filters.
- `POST /api/v1/vehicles` - Register vehicle (validates duplicate plates).
- `GET /api/v1/vehicles/:id` - Details with gate visit & shipment history.
- `PATCH /api/v1/vehicles/:id` - Update vehicle specifications.
- `DELETE /api/v1/vehicles/:id` - Archive/delete vehicle (prevents deleting active yard visits).

### Drivers
- `GET /api/v1/drivers` - Paginated drivers with license validity status.
- `POST /api/v1/drivers` - Register driver (validates duplicate license).
- `GET /api/v1/drivers/:id` - Details with vehicle assignments & gate history.
- `PATCH /api/v1/drivers/:id` - Update driver record.
- `DELETE /api/v1/drivers/:id` - Deactivate/delete driver.

### Gate Operations
- `GET /api/v1/gate-visits` - List gate visits with duration calculations.
- `POST /api/v1/gate-visits` - Check-in arriving vehicle & issue pass.
- `GET /api/v1/gate-visits/:id` - Detailed visit record with movement history.
- `POST /api/v1/gate-visits/:id/exit` - Check-out vehicle and release slot.
- `POST /api/v1/gate-visits/:id/reassign-slot` - Reassign parking slot.

### Yard Zones & Slots
- `GET /api/v1/yard-map` - Visual layout grouped by zones with utilization.
- `GET /api/v1/yard-movements` - Immutable vehicle movement audit trail.
- `GET, POST /api/v1/yard-zones` - Yard zones CRUD.
- `GET, POST /api/v1/yard-slots` - Yard slots CRUD.
- `POST /api/v1/yard-slots/:id/allocate` - Concurrency-safe slot allocation.
- `POST /api/v1/yard-slots/:id/release` - Release parking slot.

### Docks & Appointments
- `GET, POST /api/v1/docks` - Docks directory CRUD.
- `GET, POST /api/v1/dock-appointments` - Schedule dock appointment (overlap-safe).
- `POST /api/v1/dock-appointments/:id/start` - Mark dock operation In Progress.
- `POST /api/v1/dock-appointments/:id/complete` - Mark dock operation Completed.
- `POST /api/v1/dock-appointments/:id/cancel` - Cancel appointment.

### Shipments
- `GET, POST /api/v1/shipments` - Shipment orders CRUD.
- `GET /api/v1/shipments/:id` - Shipment details with milestone timeline.
- `POST /api/v1/shipments/:id/events` - Log status milestone (validates state machine).
- `GET /api/v1/shipments/track/:trackingNumber` - Public restricted tracking view.

### Dashboard & Analytics
- `GET /api/v1/dashboard` - Real-time computed yard telemetry.
- `GET /api/v1/reports/gate-visits` - Turnaround duration report.
- `GET /api/v1/reports/yard-utilization` - Yard slot occupancy metrics.
- `GET /api/v1/reports/dock-utilization` - Dock schedule utilization metrics.
- `GET /api/v1/reports/shipments` - Shipment volume and status breakdown.
- `GET /api/v1/reports/driver-activity` - Driver compliance and visit logs.
- `GET /api/v1/reports/export?type=<type>` - CSV export with formula injection sanitization.

---

## 10. Security & Hardening Measures

- **Formula Injection Prevention**: In user-controlled CSV exports, values starting with `=, +, -, @, \t, \r` are safely escaped with a leading apostrophe `'`.
- **Double-Submit CSRF**: State-changing operations validate `X-CSRF-Token` headers for cookie-authenticated sessions.
- **Brute-Force Rate Limiting**: Dedicated rate limiting on `/api/v1/auth/login` (max 20 attempts per 15 minutes) and API endpoints.
- **Server-Derived Audit Fields**: All timestamps, user references, gate pass numbers, and tracking codes are strictly generated on the server.
- **Protected Public Endpoints**: Public tracking returns only public milestone information, stripping internal notes, user IDs, and gate visit references.
