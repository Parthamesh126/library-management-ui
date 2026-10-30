import { useCallback, useEffect, useMemo, useState } from "react";
import api from "../services/api";

function Borrowing() {
  const [books, setBooks] = useState([]);
  const [members, setMembers] = useState([]);
  const [borrowings, setBorrowings] = useState([]);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [returningId, setReturningId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  const [formData, setFormData] = useState({
    bookId: "",
    memberId: "",
  });

  // Get a useful message from backend errors
  const getErrorMessage = (err, fallback) => {
    const data = err.response?.data;

    if (data?.errors && typeof data.errors === "object") {
      return Object.values(data.errors).join(", ");
    }

    return data?.message || data?.detail || data?.title || fallback;
  };

  // Load books, members, and their borrowing histories
  const fetchData = useCallback(async (showLoader = true) => {
    try {
      if (showLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const [booksResponse, membersResponse] = await Promise.all([
        api.get("/books"),
        api.get("/members"),
      ]);

      const loadedBooks = Array.isArray(booksResponse.data)
        ? booksResponse.data
        : [];

      const loadedMembers = Array.isArray(membersResponse.data)
        ? membersResponse.data
        : [];

      setBooks(loadedBooks);
      setMembers(loadedMembers);

      // Fetch borrowing history for each member.
      // The available backend endpoint returns history by member ID.
      const historyResults = await Promise.allSettled(
        loadedMembers.map((member) =>
          api.get(`/borrows/members/${member.id}/history`)
        )
      );

      const allBorrowings = [];
      const failedHistories = [];

      historyResults.forEach((result, index) => {
        if (result.status === "fulfilled") {
          const data = result.value.data;

          if (Array.isArray(data)) {
            allBorrowings.push(...data);
          } else if (data && Array.isArray(data.content)) {
            // Supports a paginated response if the backend returns one.
            allBorrowings.push(...data.content);
          }
        } else {
          failedHistories.push(loadedMembers[index]?.id);
          console.error(
            `Failed to load history for member ${loadedMembers[index]?.id}:`,
            result.reason
          );
        }
      });

      // Remove duplicate records if the backend returns any.
      const uniqueBorrowings = Array.from(
        new Map(allBorrowings.map((item) => [item.id, item])).values()
      );

      setBorrowings(uniqueBorrowings);

      if (failedHistories.length > 0) {
        setError(
          `Borrowing history could not be loaded for ${failedHistories.length} member(s). Other records were loaded where available.`
        );
      }
    } catch (err) {
      console.error("Failed to load borrowing data:", err);

      setError(
        getErrorMessage(
          err,
          "Unable to load borrowing data. Check whether the backend is running."
        )
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial page load
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Available books
  const availableBooks = useMemo(
    () => books.filter((book) => book.available === true),
    [books]
  );

  // Handle form changes
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // Borrow a book
  const handleBorrow = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!formData.bookId) {
      setError("Please select a book.");
      return;
    }

    if (!formData.memberId) {
      setError("Please select a member.");
      return;
    }

    const payload = {
      bookId: Number(formData.bookId),
      memberId: Number(formData.memberId),
    };

    try {
      setSubmitting(true);

      await api.post("/borrows", payload);

      setMessage("Book borrowed successfully!");

      setFormData({
        bookId: "",
        memberId: "",
      });

      await fetchData(false);
    } catch (err) {
      console.error("Failed to borrow book:", err.response?.data ?? err);

      setError(
        getErrorMessage(
          err,
          "Unable to borrow this book. It may already be borrowed."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Return a borrowed book
  const handleReturn = async (borrowing) => {
    const confirmed = window.confirm(
      `Return "${borrowing.bookTitle || `Book #${borrowing.bookId}`}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      setReturningId(borrowing.id);

      await api.put(`/borrows/${borrowing.id}/return`);

      setMessage(
        `"${borrowing.bookTitle || `Book #${borrowing.bookId}`}" returned successfully!`
      );

      await fetchData(false);
    } catch (err) {
      console.error("Failed to return book:", err.response?.data ?? err);

      setError(
        getErrorMessage(
          err,
          "Unable to return this book. Please check its current borrowing status."
        )
      );
    } finally {
      setReturningId(null);
    }
  };

  // Format dates for display
  const formatDate = (date) => {
    if (!date) {
      return "—";
    }

    // LocalDate values from the backend are normally YYYY-MM-DD.
    const dateOnly = String(date).slice(0, 10);
    const parts = dateOnly.split("-");

    if (parts.length === 3) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }

    return dateOnly;
  };

  // Normalize status for comparisons
  const getStatus = (borrowing) => {
    if (borrowing.status) {
      return String(borrowing.status).toUpperCase();
    }

    return borrowing.returnedAt ? "RETURNED" : "ACTIVE";
  };

  // Filter borrowing records
  const filteredBorrowings = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return borrowings.filter((borrowing) => {
      const status = getStatus(borrowing);

      const matchesStatus =
        statusFilter === "ALL" || status === statusFilter;

      const matchesSearch =
        String(borrowing.id ?? "").toLowerCase().includes(search) ||
        String(borrowing.bookId ?? "").toLowerCase().includes(search) ||
        String(borrowing.memberId ?? "").toLowerCase().includes(search) ||
        (borrowing.bookTitle || "").toLowerCase().includes(search) ||
        (borrowing.memberName || "").toLowerCase().includes(search);

      return matchesStatus && matchesSearch;
    });
  }, [borrowings, searchTerm, statusFilter]);

  const activeCount = borrowings.filter((item) =>
    ["ACTIVE", "OVERDUE"].includes(getStatus(item))
  ).length;

  const returnedCount = borrowings.filter(
    (item) => getStatus(item) === "RETURNED"
  ).length;

  const overdueCount = borrowings.filter(
    (item) => getStatus(item) === "OVERDUE"
  ).length;

  // Status badge styling
  const getStatusStyle = (status) => {
    const styles = {
      ACTIVE: {
        background: "#dbeafe",
        color: "#1d4ed8",
      },
      RETURNED: {
        background: "#dcfce7",
        color: "#15803d",
      },
      OVERDUE: {
        background: "#fee2e2",
        color: "#b91c1c",
      },
    };

    return {
      display: "inline-block",
      padding: "5px 10px",
      borderRadius: "20px",
      fontSize: "12px",
      fontWeight: 600,
      ...styles[status],
    };
  };

  if (loading) {
    return (
      <div className="page-content">
        <p>Loading borrowing records...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <h1>Borrowing</h1>
          <p>Manage borrowed books, returns, and borrowing history.</p>
        </div>

        <button
          type="button"
          onClick={() => {
            setMessage("");
            fetchData(false);
          }}
          disabled={refreshing}
          style={{
            padding: "10px 16px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            background: "#ffffff",
            color: "#374151",
            cursor: refreshing ? "not-allowed" : "pointer",
          }}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* Success message */}
      {message && (
        <p
          role="status"
          style={{
            color: "#15803d",
            background: "#f0fdf4",
            border: "1px solid #bbf7d0",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {message}
        </p>
      )}

      {/* Error message */}
      {error && (
        <p
          role="alert"
          style={{
            color: "#dc2626",
            background: "#fef2f2",
            border: "1px solid #fecaca",
            padding: "12px",
            borderRadius: "8px",
            marginBottom: "16px",
          }}
        >
          {error}
        </p>
      )}

      {/* Summary cards */}
      <div className="stats-grid" style={{ marginBottom: "24px" }}>
        <div className="stat-card">
          <p style={{ color: "#64748b", margin: 0 }}>Total Borrowings</p>
          <h2 style={{ marginBottom: 0 }}>{borrowings.length}</h2>
        </div>

        <div className="stat-card">
          <p style={{ color: "#64748b", margin: 0 }}>Currently Borrowed</p>
          <h2 style={{ marginBottom: 0 }}>{activeCount}</h2>
        </div>

        <div className="stat-card">
          <p style={{ color: "#64748b", margin: 0 }}>Returned</p>
          <h2 style={{ marginBottom: 0 }}>{returnedCount}</h2>
        </div>

        <div className="stat-card">
          <p style={{ color: "#64748b", margin: 0 }}>Overdue</p>
          <h2 style={{ marginBottom: 0 }}>{overdueCount}</h2>
        </div>
      </div>

      {/* Borrow a book form */}
      <div className="content-card form-card">
        <h2>Borrow a Book</h2>

        <form onSubmit={handleBorrow}>
          {/* Book dropdown */}
          <label htmlFor="bookId">Select Available Book</label>

          <select
            id="bookId"
            name="bookId"
            value={formData.bookId}
            onChange={handleChange}
            required
            disabled={availableBooks.length === 0 || submitting}
            style={{
              width: "100%",
              padding: "11px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#ffffff",
              color: "#1f2937",
            }}
          >
            <option value="">
              {availableBooks.length === 0
                ? "No available books"
                : "Select a book"}
            </option>

            {availableBooks.map((book) => (
              <option key={book.id} value={book.id}>
                {book.title} — {book.authorName || `Author #${book.authorId}`}
              </option>
            ))}
          </select>

          {/* Member dropdown */}
          <label htmlFor="memberId">Select Member</label>

          <select
            id="memberId"
            name="memberId"
            value={formData.memberId}
            onChange={handleChange}
            required
            disabled={members.length === 0 || submitting}
            style={{
              width: "100%",
              padding: "11px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
              backgroundColor: "#ffffff",
              color: "#1f2937",
            }}
          >
            <option value="">
              {members.length === 0
                ? "No members available"
                : "Select a member"}
            </option>

            {members.map((member) => (
              <option key={member.id} value={member.id}>
                {member.name} — ID: {member.id}
              </option>
            ))}
          </select>

          {/* Submit button */}
          <button
            type="submit"
            className="primary-button"
            disabled={
              submitting ||
              availableBooks.length === 0 ||
              members.length === 0
            }
            style={{
              marginTop: "12px",
              opacity:
                submitting ||
                availableBooks.length === 0 ||
                members.length === 0
                  ? 0.6
                  : 1,
              cursor: submitting ? "not-allowed" : "pointer",
            }}
          >
            {submitting ? "Processing..." : "Borrow Book"}
          </button>

          {availableBooks.length === 0 && (
            <p style={{ color: "#b45309", fontSize: "13px" }}>
              No books are currently available to borrow.
            </p>
          )}

          {members.length === 0 && (
            <p style={{ color: "#b45309", fontSize: "13px" }}>
              Add a library member before creating a borrowing record.
            </p>
          )}
        </form>
      </div>

      {/* Borrowing history */}
      <div className="content-card">
        <h2>Borrowing History ({filteredBorrowings.length})</h2>

        {/* Search and status filter */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "16px",
            marginBottom: "16px",
            flexWrap: "wrap",
          }}
        >
          <input
            type="search"
            placeholder="Search book, member, or ID..."
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            aria-label="Search borrowing history"
            style={{
              flex: "1",
              minWidth: "220px",
              padding: "11px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              fontSize: "14px",
            }}
          />

          <select
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
            aria-label="Filter by borrowing status"
            style={{
              minWidth: "160px",
              padding: "11px 12px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#374151",
            }}
          >
            <option value="ALL">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="OVERDUE">Overdue</option>
            <option value="RETURNED">Returned</option>
          </select>
        </div>

        {filteredBorrowings.length === 0 ? (
          <p style={{ color: "#64748b", marginTop: "16px" }}>
            {borrowings.length === 0
              ? "No borrowing records found."
              : "No records match your search or selected status."}
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Book</th>
                  <th>Member</th>
                  <th>Borrowed Date</th>
                  <th>Due Date</th>
                  <th>Returned Date</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody>
                {filteredBorrowings.map((borrowing) => {
                  const status = getStatus(borrowing);
                  const canReturn = ["ACTIVE", "OVERDUE"].includes(status);

                  return (
                    <tr key={borrowing.id}>
                      <td>{borrowing.id}</td>

                      <td>
                        <strong>
                          {borrowing.bookTitle ||
                            `Book #${borrowing.bookId}`}
                        </strong>
                      </td>

                      <td>
                        {borrowing.memberName ||
                          `Member #${borrowing.memberId}`}
                      </td>

                      <td>{formatDate(borrowing.borrowedAt)}</td>

                      <td>{formatDate(borrowing.dueDate)}</td>

                      <td>{formatDate(borrowing.returnedAt)}</td>

                      <td>
                        <span style={getStatusStyle(status)}>
                          {status}
                        </span>
                      </td>

                      <td>
                        {canReturn ? (
                          <button
                            type="button"
                            onClick={() => handleReturn(borrowing)}
                            disabled={returningId === borrowing.id}
                            style={{
                              padding: "7px 12px",
                              border: "1px solid #bbf7d0",
                              borderRadius: "6px",
                              background: "#f0fdf4",
                              color: "#15803d",
                              cursor: "pointer",
                              opacity:
                                returningId === borrowing.id ? 0.6 : 1,
                            }}
                          >
                            {returningId === borrowing.id
                              ? "Returning..."
                              : "Return"}
                          </button>
                        ) : (
                          <span style={{ color: "#64748b" }}>—</span>
                        )}
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

export default Borrowing;