import { useEffect, useState } from "react";
import api from "../services/api";

function Authors() {
  const [authors, setAuthors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });

  // Fetch all authors
  const fetchAuthors = async () => {
    try {
      setLoading(true);

      const response = await api.get("/authors");

      setAuthors(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch authors:", err);

      setError(
        err.response?.data?.message ||
          "Unable to load authors. Please check your backend."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
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
      name: "",
      email: "",
    });

    setEditingId(null);
    setShowForm(false);
  };

  // Open Add Author form
  const handleAdd = () => {
    setFormData({
      name: "",
      email: "",
    });

    setEditingId(null);
    setMessage("");
    setError("");
    setShowForm(true);
  };

  // Open Edit Author form
  const handleEdit = (author) => {
    setFormData({
      name: author.name || "",
      email: author.email || "",
    });

    setEditingId(author.id);
    setMessage("");
    setError("");
    setShowForm(true);

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  // Save new author or update existing author
  const handleSubmit = async (event) => {
    event.preventDefault();

    setMessage("");
    setError("");

    const payload = {
      name: formData.name.trim(),
      email: formData.email.trim() || null,
    };

    try {
      setSubmitting(true);

      if (editingId !== null) {
        await api.put(`/authors/${editingId}`, payload);
        setMessage("Author updated successfully!");
      } else {
        await api.post("/authors", payload);
        setMessage("Author added successfully!");
      }

      resetForm();
      await fetchAuthors();
    } catch (err) {
      console.error(
        "Failed to save author:",
        err.response?.data ?? err
      );

      const responseData = err.response?.data;

      if (responseData?.errors) {
        setError(Object.values(responseData.errors).join(", "));
      } else {
        setError(
          responseData?.message ||
            responseData?.detail ||
            `Unable to ${editingId !== null ? "update" : "add"} author.`
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Delete author
  const handleDelete = async (author) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete "${author.name}"?`
    );

    if (!confirmed) {
      return;
    }

    setMessage("");
    setError("");
    setDeletingId(author.id);

    try {
      await api.delete(`/authors/${author.id}`);

      setMessage("Author deleted successfully!");

      if (editingId === author.id) {
        resetForm();
      }

      await fetchAuthors();
    } catch (err) {
      console.error(
        "Failed to delete author:",
        err.response?.data ?? err
      );

      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to delete author. The endpoint may be missing, or the author may have associated books."
      );
    } finally {
      setDeletingId(null);
    }
  };

  if (loading) {
    return <div className="page-content">Loading authors...</div>;
  }

  return (
    <div className="page-content">
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <h1>Authors</h1>
          <p>Manage the authors in your library collection.</p>
        </div>

        <button
          type="button"
          className="primary-button"
          onClick={showForm ? resetForm : handleAdd}
        >
          {showForm ? "Cancel" : "+ Add Author"}
        </button>
      </div>

      {/* Success message */}
      {message && (
        <p
          role="status"
          style={{
            color: "#15803d",
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
            marginBottom: "16px",
          }}
        >
          {error}
        </p>
      )}

      {/* Add / Edit Author form */}
      {showForm && (
        <div className="content-card form-card">
          <h2>{editingId !== null ? "Edit Author" : "Add New Author"}</h2>

          <form onSubmit={handleSubmit}>
            <label htmlFor="name">Author Name</label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter author name"
              value={formData.name}
              onChange={handleChange}
              maxLength={100}
              required
            />

            <label htmlFor="email">Email Address (Optional)</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              maxLength={150}
            />

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
                disabled={submitting}
                style={{
                  opacity: submitting ? 0.6 : 1,
                  cursor: submitting ? "not-allowed" : "pointer",
                }}
              >
                {submitting
                  ? "Saving..."
                  : editingId !== null
                    ? "Update Author"
                    : "Save Author"}
              </button>

              <button
                type="button"
                onClick={resetForm}
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
          </form>
        </div>
      )}

      {/* Author statistics */}
      <div className="stats-grid">
        <div className="stat-card">
          <span>Total Authors</span>
          <h2>{authors.length}</h2>
        </div>
      </div>

      {/* Authors table */}
      <div className="content-card">
        <h2>All Authors ({authors.length})</h2>

        {authors.length === 0 ? (
          <p>No authors found. Click "+ Add Author" to create one.</p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Author Name</th>
                  <th>Email Address</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {authors.map((author) => (
                  <tr key={author.id}>
                    <td>{author.id}</td>

                    <td>
                      <strong>{author.name}</strong>
                    </td>

                    <td>{author.email || "—"}</td>

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
                          onClick={() => handleEdit(author)}
                          disabled={deletingId !== null}
                          style={{
                            padding: "7px 12px",
                            border: "1px solid #c7d2fe",
                            borderRadius: "7px",
                            background: "#eef2ff",
                            color: "#4338ca",
                            cursor: "pointer",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDelete(author)}
                          disabled={deletingId !== null}
                          style={{
                            padding: "7px 12px",
                            border: "1px solid #fecaca",
                            borderRadius: "7px",
                            background: "#fef2f2",
                            color: "#b91c1c",
                            cursor: deletingId !== null
                              ? "not-allowed"
                              : "pointer",
                            opacity: deletingId === author.id ? 0.6 : 1,
                          }}
                        >
                          {deletingId === author.id
                            ? "Deleting..."
                            : "Delete"}
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

export default Authors;