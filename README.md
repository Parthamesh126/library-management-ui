# Library Management System

A full-stack Library Management System built with **React** and **Spring Boot** to manage books, authors, members, and borrowing activities through a REST API.

## Features

- **Dashboard:** View library statistics and recent borrowing activity.
- **Author Management:** Add, view, update, and manage author records.
- **Book Management:** Create, view, update, and delete books, with author association.
- **Member Management:** Register members, update their information, and view member details.
- **Borrowing Management:** Borrow available books, view borrowing history, and process returns.
- **REST API Integration:** Communicate with the Spring Boot backend using Axios.
- **Data Validation:** Validate user inputs and handle API errors.
- **Persistent Database:** Configure the backend to use file-based H2 storage.
- **Responsive Interface:** A clean interface for navigating library operations.

## Technology Stack

### Frontend
- React
- JavaScript
- Vite
- React Router
- Axios
- Lucide React
- HTML5 and CSS3

### Backend
- Java 21
- Spring Boot
- Spring Web
- Spring Data JPA / Hibernate
- Bean Validation
- Maven

### Database and API Documentation
- H2 Database
- RESTful APIs
- Springdoc OpenAPI / Swagger UI

## Project Structure

```text
library-management/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── components/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── README.md
│
└── backend/
    ├── src/
    │   ├── main/
    │   └── test/
    ├── pom.xml
    └── README.md
```

*Note: The structure above is illustrative. Update it to match your actual repository layout.*

## Prerequisites

Install the following before running the application:

- Java 21 or the Java version configured by the backend project
- Node.js and npm
- Maven, or use the included Maven Wrapper
- Git

## Getting Started

### 1. Start the Backend

Open a terminal in the Spring Boot backend directory.

Using the Maven Wrapper on Windows:

```powershell
.\mvnw.cmd spring-boot:run
```

Alternatively, build and test the backend:

```powershell
.\mvnw.cmd clean test
```

The backend is expected to run at:

```text
http://localhost:8080
```

### 2. Start the Frontend

Open another terminal in the React frontend directory:

```bash
npm install
npm run dev
```

Open the local URL displayed by Vite in your terminal.

### 3. Build the Frontend

To create a production build:

```bash
npm run build
```

To run the frontend linter:

```bash
npm run lint
```

## API Configuration

The frontend communicates with the backend through Axios.

The default API base URL is:

```text
http://localhost:8080/api
```

The Axios configuration is maintained in:

```text
src/services/api.js
```

Ensure the backend is running and that its endpoints match the frontend requests.

## Main API Endpoints

| Resource | Method | Endpoint |
|---|---|---|
| Authors | GET | `/api/authors` |
| Authors | POST | `/api/authors` |
| Authors | GET | `/api/authors/{id}` |
| Authors | PUT | `/api/authors/{id}` |
| Books | GET | `/api/books` |
| Books | POST | `/api/books` |
| Books | GET | `/api/books/{id}` |
| Books | PUT | `/api/books/{id}` |
| Books | DELETE | `/api/books/{id}` |
| Members | GET | `/api/members` |
| Members | POST | `/api/members` |
| Members | GET | `/api/members/{id}` |
| Members | PUT | `/api/members/{id}` |
| Borrowing | POST | `/api/borrows` |
| Return Book | PUT | `/api/borrows/{id}/return` |
| Borrowing History | GET | `/api/borrows/members/{memberId}/history` |

Confirm endpoint availability against the actual backend controller implementations before relying on this table.

## API Documentation

If Springdoc OpenAPI is configured, access the API documentation at:

```text
http://localhost:8080/swagger-ui/index.html
```

The OpenAPI specification is generally available at:

```text
http://localhost:8080/v3/api-docs
```

## Database Configuration

The backend can use H2 file-based storage to preserve data between application restarts.

For local development, configure the datasource and JPA settings in the backend's application properties. Keep database files and credentials out of public repositories when appropriate.

## Error Handling

The application should display useful feedback when requests fail, input validation fails, or a requested record cannot be found.

## Future Improvements

- Authentication and role-based authorization
- Pagination and advanced search
- Automated integration testing
- Deployment with environment-specific configuration
- Improved reporting and borrowing analytics

## License

This project is available for educational and demonstration purposes unless a separate license is specified.