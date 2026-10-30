import { useEffect, useState } from "react";
import api from "../services/api";

function Books() {
  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);

  const [loading, setLoading] = useState(true);
  const [loadingAuthors, setLoadingAuthors] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState(null);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    title: "",
    isbn: "",
    authorId: "",
  });

  // Fetch all books
  const fetchBooks = async () => {
    try {
      setLoading(true);

      const response = await api.get("/books");

      setBooks(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch books:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to load books. Check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch authors for the dropdown
  const fetchAuthors = async () => {
    try {
      setLoadingAuthors(true);

      const response = await api.get("/authors");

      setAuthors(Array.isArray(response.data) ? response.data : []);
    } catch (err) {
      console.error("Failed to fetch authors:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to load authors."
      );
    } finally {
      setLoadingAuthors(false);
    }
  };

  // Load books and authors on page load
  useEffect(() => {
    fetchBooks();
    fetchAuthors();
  }, []);

  // Handle form inputs
  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      title: "",
      isbn: "",
      authorId: "",
    });

    setEditingId(null);
  };

  // Open form for adding a book
  const handleAdd = () => {
    resetForm();
    setError("");
    setMessage("");
    setShowForm(true);
  };

  // Open form for editing a book
  const handleEdit = (book) => {
    setFormData({
      title: book.title || "",
      isbn: book.isbn || "",
      authorId: String(book.authorId ?? ""),
    });

    setEditingId(book.id);
    setShowForm(true);
    setError("");
    setMessage("");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Cancel form
  const handleCancel = () => {
    resetForm();
    setShowForm(false);
    setError("");
  };

  // Display a useful backend error message
  const getErrorMessage = (err, fallback) => {
    const data = err.response?.data;

    if (data?.errors && typeof data.errors === "object") {
      return Object.values(data.errors).join(", ");
    }

    return (
      data?.message ||
      data?.detail ||
      data?.title ||
      fallback
    );
  };

  // Add or update a book
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    if (!formData.title.trim()) {
      setError("Book title is required.");
      return;
    }

    if (!formData.isbn.trim()) {
      setError("ISBN is required.");
      return;
    }

    if (!formData.authorId) {
      setError("Please select an author.");
      return;
    }

    const payload = {
      title: formData.title.trim(),
      isbn: formData.isbn.trim(),
      authorId: Number(formData.authorId),
    };

    try {
      setSubmitting(true);

      if (editingId !== null) {
        await api.put(`/books/${editingId}`, payload);
        setMessage("Book updated successfully!");
      } else {
        await api.post("/books", payload);
        setMessage("Book added successfully!");
      }

      resetForm();
      setShowForm(false);

      await fetchBooks();
    } catch (err) {
      console.error("Failed to save book:", err.response?.data ?? err);

      setError(
        getErrorMessage(
          err,
          editingId !== null
            ? "Unable to update book."
            : "Unable to add book."
        )
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Delete a book
  const handleDelete = async (book) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${book.title}"?`
    );

    if (!confirmed) {
      return;
    }

    setError("");
    setMessage("");

    try {
      setDeletingId(book.id);

      await api.delete(`/books/${book.id}`);

      setMessage(`"${book.title}" deleted successfully!`);

      if (editingId === book.id) {
        resetForm();
        setShowForm(false);
      }

      await fetchBooks();
    } catch (err) {
      console.error("Failed to delete book:", err.response?.data ?? err);

      setError(
        getErrorMessage(
          err,
          "Unable to delete book. It may have existing borrowing records."
        )
      );
    } finally {
      setDeletingId(null);
    }
  };

  // Refresh the books list
  const handleRefresh = async () => {
    setError("");
    setMessage("");

    await fetchBooks();
  };

  if (loading) {
    return (
      <div className="page-content">
        <p>Loading books...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <h1>Books</h1>
          <p>Manage your library collection.</p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            flexWrap: "wrap",
          }}
        >
          <button
            type="button"
            onClick={handleRefresh}
            disabled={loading}
            style={{
              padding: "10px 16px",
              border: "1px solid #d1d5db",
              borderRadius: "8px",
              background: "#ffffff",
              color: "#374151",
              cursor: "pointer",
            }}
          >
            Refresh
          </button>

          <button
            type="button"
            className="primary-button"
            onClick={showForm ? handleCancel : handleAdd}
          >
            {showForm ? "Cancel" : "+ Add Book"}
          </button>
        </div>
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

      {/* Add/Edit Book form */}
      {showForm && (
        <div className="content-card form-card">
          <h2>{editingId !== null ? "Edit Book" : "Add New Book"}</h2>

          <form onSubmit={handleSubmit}>
            {/* Book title */}
            <label htmlFor="title">Book Title</label>

            <input
              id="title"
              name="title"
              type="text"
              placeholder="Enter book title"
              value={formData.title}
              onChange={handleChange}
              maxLength={200}
              required
            />

            {/* ISBN */}
            <label htmlFor="isbn">ISBN</label>

            <input
              id="isbn"
              name="isbn"
              type="text"
              placeholder="Enter ISBN"
              value={formData.isbn}
              onChange={handleChange}
              maxLength={20}
              required
            />

            {/* Author dropdown */}
            <label htmlFor="authorId">Select Author</label>

            <select
              id="authorId"
              name="authorId"
              value={formData.authorId}
              onChange={handleChange}
              required
              disabled={loadingAuthors || authors.length === 0}
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
                {loadingAuthors
                  ? "Loading authors..."
                  : authors.length === 0
                    ? "No authors available"
                    : "Select an author"}
              </option>

              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>

            {/* Selected author details */}
            {formData.authorId && (
              <div
                style={{
                  padding: "12px",
                  marginTop: "4px",
                  backgroundColor: "#f8fafc",
                  border: "1px solid #e2e8f0",
                  borderRadius: "8px",
                  fontSize: "13px",
                }}
              >
                <strong>Selected Author</strong>

                <p style={{ margin: "6px 0 0", color: "#64748b" }}>
                  {authors.find(
                    (author) =>
                      String(author.id) === formData.authorId
                  )?.name || "Selected author"}
                </p>
              </div>
            )}

            {/* Form buttons */}
            <div
              style={{
                display: "flex",
                gap: "12px",
                marginTop: "10px",
                flexWrap: "wrap",
              }}
            >
              <button
                type="submit"
                className="primary-button"
                disabled={
                  submitting ||
                  loadingAuthors ||
                  authors.length === 0
                }
                style={{
                  opacity:
                    submitting || loadingAuthors || authors.length === 0
                      ? 0.6
                      : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Book"
                    : "Save Book"}
              </button>

              <button
                type="button"
                onClick={handleCancel}
                disabled={submitting}
                style={{
                  padding: "10px 16px",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  background: "#ffffff",
                  color: "#374151",
                  cursor: "pointer",
                }}
              >
                Cancel
              </button>
            </div>

            {!loadingAuthors && authors.length === 0 && (
              <p style={{ color: "#b45309", fontSize: "13px" }}>
                No authors found. Please add an author before creating a book.
              </p>
            )}
          </form>
        </div>
      )}

      {/* Books table */}
      <div className="content-card">
        <h2>All Books ({books.length})</h2>

        {books.length === 0 ? (
          <p style={{ color: "#64748b", marginTop: "16px" }}>
            No books found. Click "+ Add Book" to create your first book.
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Book Title</th>
                  <th>ISBN</th>
                  <th>Author</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {books.map((book) => (
                  <tr key={book.id}>
                    <td>{book.id}</td>

                    <td>
                      <strong>{book.title}</strong>
                    </td>

                    <td>{book.isbn}</td>

                    <td>
                      {book.authorName || `Author #${book.authorId}`}
                    </td>

                    <td>
                      <span
                        className={
                          book.available
                            ? "status-available"
                            : "status-borrowed"
                        }
                      >
                        {book.available ? "Available" : "Borrowed"}
                      </span>
                    </td>

                    <td>
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          flexWrap: "wrap",
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleEdit(book)}
                          disabled={deletingId === book.id}
                          style={{
                            padding: "7px 12px",
                            border: "1px solid #bfdbfe",
                            borderRadius: "6px",
                            background: "#eff6ff",
                            color: "#1d4ed8",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(book)}
                          disabled={deletingId === book.id}
                          style={{
                            padding: "7px 12px",
                            border: "1px solid #fecaca",
                            borderRadius: "6px",
                            background: "#fef2f2",
                            color: "#dc2626",
                            cursor: "pointer",
                            opacity: deletingId === book.id ? 0.6 : 1,
                          }}
                        >
                          {deletingId === book.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default Books;