import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Users,
  UserRound,
  ArrowLeftRight,
  Library,
} from "lucide-react";
import Books from "./pages/Books";
import Authors from "./pages/Authors";
import Members from "./pages/Members";
import "./App.css";
import Borrowing from "./pages/Borrowing";

const navigation = [
  { name: "Dashboard", path: "/dashboard", icon: LayoutDashboard },
  { name: "Books", path: "/books", icon: BookOpen },
  { name: "Authors", path: "/authors", icon: Users },
  { name: "Members", path: "/members", icon: UserRound },
  { name: "Borrowing", path: "/borrowing", icon: ArrowLeftRight },
];

function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-icon">
          <Library size={23} />
        </div>

        <div>
          <h2>Libra</h2>
          <span>Management System</span>
        </div>
      </div>

      <p className="nav-heading">WORKSPACE</p>

      <nav className="navigation">
        {navigation.map(({ name, path, icon: Icon }) => (
          <a href={path} key={path} className="nav-link">
            <Icon size={19} />
            <span>{name}</span>
          </a>
        ))}
      </nav>

      <div className="sidebar-footer">
        <div className="avatar">PK</div>

        <div>
          <strong>Administrator</strong>
          <span>Library Manager</span>
        </div>
      </div>
    </aside>
  );
}

function Header() {
  return (
    <header className="header">
      <div>
        <h1>Library Overview</h1>
        <p>Manage your library from one place.</p>
      </div>

      <div className="header-badge">
        <span className="status-dot"></span>
        Library Management
      </div>
    </header>
  );
}

function Dashboard() {
  return (
    <div className="page-content">
      <div className="welcome-card">
        <div>
          <span className="eyebrow">YOUR LIBRARY</span>
          <h2>Welcome to your library dashboard.</h2>
          <p>
            Manage books, authors, members, and borrowing records
            from one convenient workspace.
          </p>
        </div>

        <div className="welcome-icon">
          <Library size={48} />
        </div>
      </div>

      <div className="section-heading">
        <div>
          <h2>Library Management</h2>
          <p>Select a section to get started.</p>
        </div>
      </div>

      <div className="management-grid">
        {navigation.slice(1).map(({ name, path, icon: Icon }) => (
          <a href={path} className="management-card" key={path}>
            <div className="card-icon">
              <Icon size={24} />
            </div>

            <h3>{name}</h3>

            <p>View and manage your {name.toLowerCase()}.</p>

            <span className="card-action">
              Open section <span aria-hidden="true">→</span>
            </span>
          </a>
        ))}
      </div>

      <div className="api-notice">
        <span className="status-dot"></span>
        <div>
          <strong>Backend integration comes next</strong>
          <p>
            We'll connect this dashboard to your existing Spring Boot APIs.
          </p>
        </div>
      </div>
    </div>
  );
}

function PlaceholderPage({ title }) {
  return (
    <div className="page-content">
      <div className="section-heading">
        <div>
          <h2>{title}</h2>
          <p>This section will be connected to your backend API.</p>
        </div>
      </div>

      <div className="placeholder-card">
        <BookOpen size={32} />
        <h3>{title} management</h3>
        <p>We'll implement this page in the next steps.</p>
      </div>
    </div>
  );
}

function AppLayout() {
  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <Header />

        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/books" element={<Books />}/>
          <Route path="/authors" element={<Authors />} />
          <Route path="/members" element={<Members />} />
          <Route path="/borrowing" element={<Borrowing />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}