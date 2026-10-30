import { useCallback, useEffect, useState } from "react";
import {
  BookOpen,
  Users,
  UserRound,
  BookCheck,
  RefreshCw,
  AlertCircle,
  Clock,
  CheckCircle,
  Activity,
} from "lucide-react";
import api from "../services/api";

const getList = (response) => {
  const data = response?.data;

  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.content)) return data.content;
  if (Array.isArray(data?.data)) return data.data;
  if (Array.isArray(data?.items)) return data.items;

  return [];
};

const getBorrowingStatus = (borrow) =>
  String(borrow?.status ?? "").toUpperCase();

const formatDate = (date) => {
  if (!date) return "—";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalBooks: 0,
    availableBooks: 0,
    totalAuthors: 0,
    totalMembers: 0,
    activeBorrows: 0,
    returnedBorrows: 0,
    overdueBorrows: 0,
  });

  const [recentBorrows, setRecentBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const [booksResponse, authorsResponse, membersResponse] =
        await Promise.all([
          api.get("/books"),
          api.get("/authors"),
          api.get("/members"),
        ]);

      const books = getList(booksResponse);
      const authors = getList(authorsResponse);
      const members = getList(membersResponse);

      const availableBooks = books.filter(
        (book) => book.available === true
      ).length;

      // Load each member's borrowing history.
      const historyResults = await Promise.allSettled(
        members
          .filter((member) => member.id != null)
          .map((member) =>
            api.get(`/borrows/members/${member.id}/history`)
          )
      );

      const borrowingHistory = historyResults.flatMap((result) => {
        if (result.status !== "fulfilled") {
          return [];
        }

        return getList(result.value);
      });

      const activeBorrows = borrowingHistory.filter(
        (borrow) => getBorrowingStatus(borrow) === "ACTIVE"
      ).length;

      const returnedBorrows = borrowingHistory.filter(
        (borrow) => getBorrowingStatus(borrow) === "RETURNED"
      ).length;

      const overdueBorrows = borrowingHistory.filter(
        (borrow) => getBorrowingStatus(borrow) === "OVERDUE"
      ).length;

      setStats({
        totalBooks: books.length,
        availableBooks,
        totalAuthors: authors.length,
        totalMembers: members.length,
        activeBorrows,
        returnedBorrows,
        overdueBorrows,
      });

      const sortedHistory = [...borrowingHistory].sort((a, b) => {
        const dateA = new Date(
          a.borrowedAt ?? a.borrowDate ?? 0
        ).getTime();

        const dateB = new Date(
          b.borrowedAt ?? b.borrowDate ?? 0
        ).getTime();

        return dateB - dateA;
      });

      setRecentBorrows(sortedHistory.slice(0, 5));
    } catch (err) {
      console.error("Failed to load dashboard:", err);

      setError(
        "Unable to load dashboard data. Check that the backend is running and the API endpoints are accessible."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const statCards = [
    {
      title: "Total Books",
      value: stats.totalBooks,
      icon: BookOpen,
      description: `${stats.availableBooks} available`,
    },
    {
      title: "Authors",
      value: stats.totalAuthors,
      icon: UserRound,
      description: "Registered authors",
    },
    {
      title: "Members",
      value: stats.totalMembers,
      icon: Users,
      description: "Registered members",
    },
    {
      title: "Active Borrowings",
      value: stats.activeBorrows,
      icon: BookCheck,
      description: "Currently borrowed",
    },
    {
      title: "Returned",
      value: stats.returnedBorrows,
      icon: CheckCircle,
      description: "Books returned",
    },
    {
      title: "Overdue",
      value: stats.overdueBorrows,
      icon: Clock,
      description: "Overdue borrowings",
    },
  ];

  return (
    <div className="page-content">
      <div
        className="page-heading"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "16px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <h1>Dashboard</h1>
          <p>Overview of your library management system.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={loadDashboard}
          disabled={loading}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          <RefreshCw size={16} />
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "14px",
            marginBottom: "20px",
            borderRadius: "8px",
            background: "#fef2f2",
            color: "#b91c1c",
          }}
        >
          <AlertCircle size={20} />
          <span>{error}</span>
        </div>
      )}

      <div className="stats-grid">
        {statCards.map((card) => {
          const Icon = card.icon;

          return (
            <div className="stat-card" key={card.title}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <div>
                  <p>{card.title}</p>
                  <h2>
                    {loading ? "—" : card.value}
                  </h2>
                  <small>{card.description}</small>
                </div>

                <Icon size={28} />
              </div>
            </div>
          );
        })}
      </div>

      <div
        className="content-card"
        style={{ marginTop: "24px" }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "wrap",
            marginBottom: "16px",
          }}
        >
          <div>
            <h2>Recent Borrowings</h2>
            <p>Latest borrowing activity recorded by the system.</p>
          </div>

          <Activity size={22} />
        </div>

        {loading ? (
          <p>Loading borrowing history...</p>
        ) : recentBorrows.length === 0 ? (
          <p>No borrowing records found.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Borrowed On</th>
                  <th>Due Date</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody>
                {recentBorrows.map((borrow, index) => {
                  const status = getBorrowingStatus(borrow);

                  return (
                    <tr key={borrow.id ?? index}>
                      <td>
                        {borrow.bookTitle ??
                          `Book #${borrow.bookId ?? "—"}`}
                      </td>

                      <td>
                        {borrow.memberName ??
                          `Member #${borrow.memberId ?? "—"}`}
                      </td>

                      <td>
                        {formatDate(
                          borrow.borrowedAt ?? borrow.borrowDate
                        )}
                      </td>

                      <td>{formatDate(borrow.dueDate)}</td>

                      <td>
                        <span
                          className={`status-badge status-${status.toLowerCase()}`}
                          style={{
                            display: "inline-block",
                            padding: "4px 9px",
                            borderRadius: "12px",
                            fontSize: "12px",
                            fontWeight: 600,
                            background:
                              status === "ACTIVE"
                                ? "#dbeafe"
                                : status === "RETURNED"
                                  ? "#dcfce7"
                                  : status === "OVERDUE"
                                    ? "#fee2e2"
                                    : "#f3f4f6",
                            color:
                              status === "ACTIVE"
                                ? "#1d4ed8"
                                : status === "RETURNED"
                                  ? "#166534"
                                  : status === "OVERDUE"
                                    ? "#b91c1c"
                                    : "#374151",
                          }}
                        >
                          {status || "UNKNOWN"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}