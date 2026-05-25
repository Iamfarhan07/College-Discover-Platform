# College Discovery Platform Backend MVP

This is a production-grade, backend-only MVP for a **College Discovery Platform** (similar to Careers360 and CollegeDunia). Built using Node.js, Next.js API Routes, PostgreSQL, Prisma, Zod, and JWT.

---

## 🛠️ Technology Stack
- **Runtime**: Node.js with TypeScript
- **Framework**: Next.js API Routes (Pages Router under `/pages/api`)
- **Database**: PostgreSQL (relational, fully normalized)
- **ORM**: Prisma (using v7 driver adapters for optimal edge execution)
- **Validation**: Zod (for request query, param, and body validations)
- **Authentication**: JWT (JSON Web Tokens) & `bcryptjs` for password hashing

---

## 🗄️ Database Schema Overview

The database uses a clean, normalized relational model:

```mermaid
erDiagram
    User {
        Int id PK
        String name
        String email UK
        String passwordHash
        DateTime createdAt
    }
    College {
        Int id PK
        String name
        String location
        Float fees
        Float rating
        String type
        Int established
        String overview
        String imageUrl
        DateTime createdAt
    }
    Course {
        Int id PK
        String name
        String duration
        Float fees
        Int collegeId FK
    }
    Placement {
        Int id PK
        Float averagePackage
        Float highestPackage
        String[] topRecruiters
        Int collegeId FK "Unique"
    }
    Review {
        Int id PK
        String comment
        Float rating
        Int userId FK
        Int collegeId FK
        DateTime createdAt
    }
    SavedCollege {
        Int id PK
        Int userId FK
        Int collegeId FK
        DateTime savedAt
    }

    College ||--o{ Course : "offers"
    College ||--|| Placement : "has"
    College ||--o{ Review : "receives"
    User ||--o{ Review : "writes"
    User ||--o{ SavedCollege : "saves"
    College ||--o{ SavedCollege : "saved_by"
```

---

## ⚡ Setup & Installation

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL server (running locally or remotely)

### 2. Install Dependencies
```bash
npm install
```

### 3. Environment Variables
Create a `.env` file in the root directory:
```env
DATABASE_URL="postgresql://postgres:admin123@localhost:5432/college_discovery_platform?schema=public"
JWT_SECRET="super-secret-key-college-platform-2026"
JWT_EXPIRES_IN="7d"
```

### 4. Database Setup
Push the schema to your database:
```bash
npx prisma db push
```

### 5. Generate Prisma Client
```bash
npx prisma generate
```

### 6. Run Database Seeding
This populates the database with 2 test users and 20 realistic colleges across India, each with courses, placements, and reviews:
```bash
npx prisma db seed
```

---

## 🚀 Running the Project

### Start Development Server
```bash
npm run dev
```
The server will run on `http://localhost:3000`.

### Run Verification / Integration Tests
An integration test suite has been built to test all API specifications. With the server running, execute:
```bash
npx tsx verify.ts
```

---

## 📖 API Documentation

All API responses are returned as JSON.

### 🌟 Centralized Error Handler Format
In case of a validation or client/server error, responses follow this schema:
```json
{
  "error": "Error message description",
  "details": {
    "field_name": ["Specific validation error message"]
  }
}
```

---

### 1. Authentication APIs

#### ➡️ Register User
- **Method**: `POST`
- **Path**: `/api/auth/register`
- **Body**:
  ```json
  {
    "name": "Alex Mercer",
    "email": "alex@example.com",
    "password": "securepassword123"
  }
  ```
- **Responses**:
  - **201 Created**:
    ```json
    {
      "message": "Registration successful",
      "token": "eyJhbGciOiJIUzI1Ni...",
      "user": {
        "id": 1,
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "createdAt": "2026-05-23T12:00:00.000Z"
      }
    }
    ```
  - **400 Bad Request** (Validation failures)
  - **409 Conflict** (Email already registered)

#### ➡️ Login User
- **Method**: `POST`
- **Path**: `/api/auth/login`
- **Body**:
  ```json
  {
    "email": "alex@example.com",
    "password": "securepassword123"
  }
  ```
- **Responses**:
  - **200 OK**:
    ```json
    {
      "message": "Login successful",
      "token": "eyJhbGciOiJIUzI1Ni...",
      "user": {
        "id": 1,
        "name": "Alex Mercer",
        "email": "alex@example.com",
        "createdAt": "2026-05-23T12:00:00.000Z"
      }
    }
    ```
  - **401 Unauthorized** (Invalid credentials)

---

### 2. Colleges & Search APIs

#### ➡️ College Listing & Search
- **Method**: `GET`
- **Path**: `/api/colleges`
- **Query Parameters**:
  - `search` (string, optional): Fuzzy search on college name and location. (Min 2 chars)
  - `location` (string, optional): Filter by city or state.
  - `minFees` (number, optional): Minimum fee filter.
  - `maxFees` (number, optional): Maximum fee filter.
  - `minRating` (number, optional): Minimum rating filter (0.0 to 5.0).
  - `sortBy` (string, optional): `"fees_asc" | "fees_desc" | "rating_desc" | "name_asc"`.
  - `page` (number, optional): Default 1.
  - `limit` (number, optional): Default 10 (Max 50).
- **Responses**:
  - **200 OK**:
    ```json
    {
      "data": [
        {
          "id": 1,
          "name": "Indian Institute of Technology Bombay (IIT Bombay)",
          "location": "Mumbai, Maharashtra",
          "fees": 850000,
          "rating": 4.9,
          "type": "Public",
          "established": 1958,
          "imageUrl": "https://images.unsplash.com/photo-1562774053-701939374585"
        }
      ],
      "meta": {
        "total": 20,
        "page": 1,
        "limit": 10,
        "totalPages": 2
      }
    }
    ```
  - **400 Bad Request** (Validations for search length < 2 or parameters bounds failed)

#### ➡️ College Detail
- **Method**: `GET`
- **Path**: `/api/colleges/:id`
- **Query Parameters**:
  - `reviewPage` (number, optional): Default 1 (Paginate reviews).
  - `reviewLimit` (number, optional): Default 5 (Limit reviews page size).
- **Responses**:
  - **200 OK**:
    ```json
    {
      "id": 1,
      "name": "Indian Institute of Technology Bombay (IIT Bombay)",
      "location": "Mumbai, Maharashtra",
      "fees": 850000,
      "rating": 4.9,
      "type": "Public",
      "established": 1958,
      "overview": "IIT Bombay is a premier public technical and research university...",
      "imageUrl": "https://images.unsplash.com/photo-1562774053-701939374585",
      "courses": [
        { "name": "B.Tech Computer Science and Engineering", "duration": "4 years", "fees": 900000 }
      ],
      "placements": {
        "averagePackage": 2180000,
        "highestPackage": 15000000,
        "topRecruiters": ["Google", "Microsoft", "Apple"]
      },
      "reviews": [
        { "userId": 2, "comment": "Incredible coding culture...", "rating": 5, "createdAt": "2026-05-23T06:00:00.000Z" }
      ]
    }
    ```
  - **404 Not Found**: If college does not exist.

#### ➡️ Compare Colleges
- **Method**: `GET`
- **Path**: `/api/colleges/compare`
- **Query Parameters**:
  - `ids` (string, required): Comma-separated list of 2 to 3 unique college IDs (e.g. `?ids=1,2,3`).
- **Responses**:
  - **200 OK**:
    ```json
    [
      {
        "id": 1,
        "name": "Indian Institute of Technology Bombay (IIT Bombay)",
        "location": "Mumbai, Maharashtra",
        "fees": 850000,
        "rating": 4.9,
        "placements": { "averagePackage": 2180000 },
        "courses": 3
      },
      {
        "id": 2,
        "name": "Indian Institute of Technology Delhi (IIT Delhi)",
        "location": "New Delhi, Delhi",
        "fees": 880000,
        "rating": 4.8,
        "placements": { "averagePackage": 2050000 },
        "courses": 3
      }
    ]
    ```
  - **400 Bad Request**: If fewer than 2 or more than 3 IDs are passed, or duplicate IDs are provided, or any ID is invalid/not found.

---

### 3. Saved Items (Bookmarking) APIs

*Note: All endpoints in this section require the `Authorization: Bearer <JWT_TOKEN>` header.*

#### ➡️ Save College
- **Method**: `POST`
- **Path**: `/api/saved/colleges`
- **Body**:
  ```json
  {
    "collegeId": 1
  }
  ```
- **Responses**:
  - **201 Created**:
    ```json
    {
      "message": "College saved successfully",
      "saved": {
        "id": 1,
        "userId": 2,
        "collegeId": 1,
        "savedAt": "2026-05-23T12:00:00.000Z"
      }
    }
    ```
  - **404 Not Found** (College does not exist)
  - **409 Conflict** (Already saved by the user)

#### ➡️ Get Saved Colleges List
- **Method**: `GET`
- **Path**: `/api/saved/colleges`
- **Responses**:
  - **200 OK**: Array of saved colleges:
    ```json
    [
      {
        "id": 1,
        "name": "Indian Institute of Technology Bombay (IIT Bombay)",
        "location": "Mumbai, Maharashtra",
        "fees": 850000,
        "rating": 4.9,
        "type": "Public",
        "established": 1958,
        "imageUrl": "https://images.unsplash.com/photo-1562774053-701939374585"
      }
    ]
    ```

#### ➡️ Remove Saved College
- **Method**: `DELETE`
- **Path**: `/api/saved/colleges/:collegeId`
- **Responses**:
  - **200 OK**:
    ```json
    {
      "message": "College removed from saved list successfully"
    }
    ```
  - **404 Not Found** (College not found in the user's saved list)

---

## 🚀 How to Deploy to Vercel + Neon/Railway

### 1. Database Deployment (Neon or Railway)
1. Sign up on [Neon.tech](https://neon.tech) or [Railway.app](https://railway.app).
2. Create a new PostgreSQL database instance.
3. Copy the database connection string.

### 2. Vercel Deployment
1. Import your GitHub repository to [Vercel](https://vercel.com).
2. Configure the following **Environment Variables** in Vercel settings:
   - `DATABASE_URL`: Your production PostgreSQL URL (from Neon/Railway).
   - `JWT_SECRET`: A secure random secret string.
   - `JWT_EXPIRES_IN`: `7d`
3. Deploy! Vercel will build and serve your Next.js API endpoints.

---

## 🛠️ Development & Design Choices
- **Driver Adapters**: Leverages `@prisma/adapter-pg` to ensure database drivers compile successfully in edge-like runtime environments (such as Vercel serverless functions).
- **Prisma Singleton**: Built carefully using Node's `global` context to prevent connection exhaustion in development during hot-reload cycles.
- **Cascading Deletes**: Implemented in database relationships to maintain clean data integrity when parent entities are removed.
