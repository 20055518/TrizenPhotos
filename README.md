# TrizenAI Photo Sharing Platform 📸

> **Full-Stack Internship Challenge Submission**  
> Role: Full-Stack Internship • TrizenAI Technologies Private Limited

A production-ready, collaborative photo-sharing platform designed for photography and event management teams. It allows event photographers to upload event photographs collaboratively, empowers the Lead Admin to curate and publish customer galleries, and allows customers to securely access their curated gallery using a shareable link and PIN—without needing an account.

---

## 🌟 Key Features

- **Role-Based Access Control (RBAC)**:
  - **Lead Admin**: Create events, assign photographers, view all uploaded photos, curate/select photos, and publish customer galleries with unique PINs.
  - **Team Member (Photographer)**: View assigned events, bulk upload photos, view and manage their own uploads. Strictly prevented from publishing galleries or viewing unassigned events.
  - **Public Customer**: Zero-login access via unique URL slug + secure 6-digit access PIN.
- **Pluggable Object Storage Architecture**:
  - Image files are never stored directly in the database.
  - Metadata is indexed in MongoDB while binaries are handled through a pluggable storage engine (local disk storage with automatic thumbnail generation + AWS S3 / Cloudflare R2 cloud integration ready).
- **Client Delivery Experience**:
  - PIN gate with authentication token issuance.
  - Sleek responsive masonry grid and dark-themed UI.
  - High-resolution fullscreen Lightbox viewer with keyboard arrow navigation.
  - Single-click **Download All (.ZIP)** archive generation and individual photo downloads.
- **Pre-seeded Operational State**:
  - Seeded with the exact case study from the specification:
    - **Event**: *Arjun & Priya Wedding*
    - **Gallery URL**: `/gallery/abc123`
    - **Access PIN**: `482917`

---

## 🛠️ Technology Stack

| Layer | Technology | Details |
| :--- | :--- | :--- |
| **Frontend** | React 19 + TypeScript | Vite build tool, Tailwind CSS, Lucide Icons, React Router |
| **Backend** | Python 3.14 / FastAPI | High-performance async ASGI framework, Pydantic V2 |
| **Database** | MongoDB | Document database via Motor (async driver) and PyMongo |
| **Auth & Security** | JWT + Bcrypt | Passwords & gallery PINs hashed with salted bcrypt |
| **Image Processing** | Pillow (PIL) | Automatic thumbnail generation and metadata extraction |
| **Testing** | Pytest + Httpx | 13 automated tests covering auth, RBAC, curation & PIN |
| **Containerization**| Docker & Docker Compose | Multi-container setup for frontend, backend, and MongoDB |

---

## 📐 System Architecture & Database Design

### System Architecture Diagram

```mermaid
graph TD
    subgraph Clients
        AdminUser[Lead Admin / Studio Manager]
        TeamUser[Photographer / Team Member]
        CustomerUser[Client / Event Guest]
    end

    subgraph Frontend [React + Vite SPA]
        Router[React Router]
        AdminUI[Admin Dashboard & Photo Curation]
        TeamUI[Photographer Upload Portal]
        CustomerUI[PIN Protected Gallery & Lightbox]
    end

    subgraph Backend [FastAPI Application]
        AuthRouter[/api/auth: JWT & Role Guards]
        EventRouter[/api/events: Events & Team Assignment]
        PhotoRouter[/api/photos: Uploads, Thumbnails, Stream]
        GalleryRouter[/api/galleries: PIN Auth, ZIP Download]
        StorageService[Pluggable Storage Engine]
    end

    subgraph Persistence [Data Tier]
        Mongo[(MongoDB Database)]
        Storage[(File / Object Storage)]
    end

    AdminUser --> Router
    TeamUser --> Router
    CustomerUser --> Router

    Router --> AdminUI
    Router --> TeamUI
    Router --> CustomerUI

    AdminUI --> AuthRouter
    AdminUI --> EventRouter
    AdminUI --> PhotoRouter
    AdminUI --> GalleryRouter

    TeamUI --> PhotoRouter
    TeamUI --> EventRouter

    CustomerUI --> GalleryRouter

    AuthRouter --> Mongo
    EventRouter --> Mongo
    PhotoRouter --> Mongo
    PhotoRouter --> StorageService
    GalleryRouter --> Mongo
    GalleryRouter --> StorageService
    StorageService --> Storage
```

### Database Schema (MongoDB Collections)

#### 1. `users`
```json
{
  "_id": "ObjectId",
  "name": "Pooja Sharma",
  "email": "admin@trizen.com",
  "password_hash": "$2b$12$...",
  "role": "ADMIN" | "TEAM_MEMBER",
  "created_at": "ISODate"
}
```

#### 2. `events`
```json
{
  "_id": "ObjectId",
  "name": "Arjun & Priya Wedding",
  "date": "2026-10-15",
  "location": "Taj Palace Grand Ballroom, Mumbai",
  "description": "Celebration ceremony and wedding reception photography...",
  "created_by": "ObjectId(User)",
  "assigned_team_ids": ["ObjectId(User)"],
  "created_at": "ISODate"
}
```

#### 3. `photos`
```json
{
  "_id": "ObjectId",
  "event_id": "string(EventId)",
  "uploaded_by": "string(UserId)",
  "uploaded_by_name": "Rahul Verma",
  "filename": "uuid.jpg",
  "original_name": "varmala_ceremony.jpg",
  "storage_path": "uploads/event_id/uuid.jpg",
  "url": "/api/photos/file/event_id/uuid.jpg",
  "thumbnail_url": "/api/photos/file/event_id/thumbnails/uuid.jpg",
  "file_size": 245120,
  "mime_type": "image/jpeg",
  "is_selected_for_gallery": true,
  "created_at": "ISODate"
}
```

#### 4. `galleries`
```json
{
  "_id": "ObjectId",
  "event_id": "string(EventId)",
  "slug": "abc123",
  "pin_hash": "$2b$12$...",
  "is_published": true,
  "published_at": "ISODate",
  "created_at": "ISODate"
}
```

---

## 🚀 Quick Start (Local Setup)

### Prerequisites
- **Node.js**: v18+ (v24 recommended)
- **Python**: 3.10+ (3.14 supported)
- **MongoDB**: Local MongoDB community service running on port 27017 (or MongoDB Atlas connection URI)

---

### Step 1: Clone & Setup Backend

```bash
cd backend

# 1. Create and activate virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# Linux/macOS:
source venv/bin/activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Seed demo accounts, event, and sample photos
python -m app.seed

# 4. Start the FastAPI backend server (Runs on port 8000)
python -m uvicorn app.main:app --reload --port 8000
```

---

### Step 2: Setup Frontend

Open a new terminal window:

```bash
cd frontend

# 1. Install packages
npm install

# 2. Start the Vite development server (Runs on port 5173)
npm run dev
```

Visit the application in your browser at:  
👉 **http://localhost:5173**

---

## 🔑 Demo Credentials

| Role | Email | Password | Access / Capabilities |
| :--- | :--- | :--- | :--- |
| **Lead Admin** | `admin@trizen.com` | `Admin@123` | Full control: events, team assignment, curate photos, publish galleries |
| **Photographer** | `photographer@trizen.com` | `Team@123` | Assigned to *Arjun & Priya Wedding*, bulk upload & view own photos |

### Demo Client Gallery Link & PIN

- **Public Gallery Link**: [http://localhost:5173/gallery/abc123](http://localhost:5173/gallery/abc123)
- **Access PIN**: `482917`
- *Features*: No login required; enter PIN to unlock high-res photos, view in lightbox, or download the full album as a `.ZIP` file.

---

## 🧪 Automated Testing

The backend includes a comprehensive test suite using `pytest` and `httpx` testing all security boundaries, role enforcement, and customer access flows.

Run the test suite:

```bash
cd backend
.\venv\Scripts\python -m pytest -v
```

### Test Coverage Highlights:
- ✅ `test_admin_login` & `test_team_member_login`: Validates JWT token creation and role claims.
- ✅ `test_invalid_login`: Verifies 401 Unauthorized for invalid passwords.
- ✅ `test_admin_list_events`: Ensures admins view all company events.
- ✅ `test_team_member_list_assigned_events`: Confirms photographers only see events they are assigned to.
- ✅ `test_team_member_blocked_from_publishing`: **Security Check**: Enforces HTTP 403 Forbidden when a team member attempts to publish or modify a gallery.
- ✅ `test_team_member_cannot_modify_photo_selection`: **Security Check**: Enforces HTTP 403 Forbidden when modifying curation flags.
- ✅ `test_upload_photo`: Tests multi-part image upload, thumbnail generation, and metadata indexing.
- ✅ `test_public_gallery_info`: Verifies public endpoint does not leak photo URLs or password hashes.
- ✅ `test_verify_pin_incorrect`: Blocks incorrect PIN entries with HTTP 401.
- ✅ `test_verify_pin_correct_and_curated_photos_only`: **Critical Isolation Check**: Ensures client receives only photos marked `is_selected_for_gallery: True`. Unpublished photos are strictly filtered out.
- ✅ `test_protected_gallery_photos_endpoint`: Verifies gallery session token enforcement.

---

## 🐳 Docker Deployment

To launch the full stack (MongoDB + FastAPI + React Nginx) with a single command:

```bash
docker-compose up --build
```

- Frontend: `http://localhost`
- Backend API: `http://localhost:8000`
- MongoDB: `localhost:27017`

---

## 🔒 Security Practices Enforced

1. **Strict Zero-Storage in Database**: Binary images are stored in filesystem object storage; MongoDB stores only references, hashes, and metadata.
2. **One-Way Salting & Hashing**: All passwords and gallery access PINs are salted and hashed using `bcrypt`.
3. **Event Isolation Guard**: Photographers attempting to view or upload to unassigned events receive HTTP 403 Forbidden.
4. **Curation Gate**: Only Admin roles can toggle `is_selected_for_gallery` or trigger `/publish`.
5. **Customer Session Tokens**: Gallery PIN verification generates signed, scoped JWT access tokens valid only for the specific gallery slug.
6. **Input Validation**: All API bodies and file types are strictly validated via Pydantic models and MIME-type checks.

---

## 📄 License & Attribution

Developed for the **TrizenAI Technologies Full-Stack Internship Challenge**.  
All rights reserved © 2026.
