import { useEffect, useState } from "react";
import api from "../services/api";

function Members() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });

  // Fetch all members
  const fetchMembers = async () => {
    try {
      setLoading(true);

      const response = await api.get("/members");

      setMembers(Array.isArray(response.data) ? response.data : []);
      setError("");
    } catch (err) {
      console.error("Failed to fetch members:", err);

      setError(
        err.response?.data?.message ||
          err.response?.data?.detail ||
          "Unable to load members. Please check whether the backend is running."
      );
    } finally {
      setLoading(false);
    }
  };

  // Load members when the page opens
  useEffect(() => {
    fetchMembers();
  }, []);

  // Handle form changes
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
      phone: "",
    });

    setEditingId(null);
  };

  // Open form for adding a member
  const handleAdd = () => {
    resetForm();
    setError("");
    setMessage("");
    setShowForm(true);
  };

  // Open form for editing a member
  const handleEdit = (member) => {
    setFormData({
      name: member.name || "",
      email: member.email || "",
      phone: member.phone || "",
    });

    setEditingId(member.id);
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

  // Save a member or update an existing member
  const handleSubmit = async (event) => {
    event.preventDefault();

    setError("");
    setMessage("");

    const name = formData.name.trim();
    const email = formData.email.trim();
    const phone = formData.phone.trim();

    if (!name) {
      setError("Member name is required.");
      return;
    }

    if (!email) {
      setError("Email address is required.");
      return;
    }

    const payload = {
      name,
      email,
      phone: phone || null,
    };

    try {
      setSubmitting(true);

      if (editingId !== null) {
        await api.put(`/members/${editingId}`, payload);
        setMessage("Member updated successfully!");
      } else {
        await api.post("/members", payload);
        setMessage("Member added successfully!");
      }

      resetForm();
      setShowForm(false);

      await fetchMembers();
    } catch (err) {
      console.error("Failed to save member:", err.response?.data ?? err);

      const responseData = err.response?.data;

      if (
        responseData?.errors &&
        typeof responseData.errors === "object"
      ) {
        setError(Object.values(responseData.errors).join(", "));
      } else {
        setError(
          responseData?.message ||
            responseData?.detail ||
            responseData?.title ||
            (editingId !== null
              ? "Unable to update member."
              : "Unable to add member.")
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Filter members by name, email, ID, or phone
  const filteredMembers = members.filter((member) => {
    const search = searchTerm.toLowerCase().trim();

    return (
      String(member.id ?? "").toLowerCase().includes(search) ||
      (member.name || "").toLowerCase().includes(search) ||
      (member.email || "").toLowerCase().includes(search) ||
      (member.phone || "").toLowerCase().includes(search)
    );
  });

  // Loading state
  if (loading) {
    return (
      <div className="page-content">
        <p>Loading members...</p>
      </div>
    );
  }

  return (
    <div className="page-content">
      {/* Page heading */}
      <div className="page-heading">
        <div>
          <h1>Members</h1>
          <p>Manage your library members and their details.</p>
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
            onClick={fetchMembers}
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
            {showForm ? "Cancel" : "+ Add Member"}
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

      {/* Summary cards */}
      <div
        className="stats-grid"
        style={{
          marginBottom: "24px",
        }}
      >
        <div className="stat-card">
          <p style={{ color: "#64748b", margin: 0 }}>Total Members</p>
          <h2 style={{ marginBottom: 0 }}>{members.length}</h2>
        </div>

        <div className="stat-card">
          <p style={{ color: "#64748b", margin: 0 }}>Search Results</p>
          <h2 style={{ marginBottom: 0 }}>{filteredMembers.length}</h2>
        </div>
      </div>

      {/* Add/Edit member form */}
      {showForm && (
        <div className="content-card form-card">
          <h2>{editingId !== null ? "Edit Member" : "Add New Member"}</h2>

          <form onSubmit={handleSubmit}>
            {/* Name */}
            <label htmlFor="name">Full Name</label>

            <input
              id="name"
              name="name"
              type="text"
              placeholder="Enter member name"
              value={formData.name}
              onChange={handleChange}
              maxLength={100}
              required
            />

            {/* Email */}
            <label htmlFor="email">Email Address</label>

            <input
              id="email"
              name="email"
              type="email"
              placeholder="Enter email address"
              value={formData.email}
              onChange={handleChange}
              maxLength={150}
              required
            />

            {/* Phone */}
            <label htmlFor="phone">Phone Number</label>

            <input
              id="phone"
              name="phone"
              type="tel"
              placeholder="Enter phone number"
              value={formData.phone}
              onChange={handleChange}
              maxLength={20}
            />

            {/* Form actions */}
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
                    ? "Update Member"
                    : "Save Member"}
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
          </form>
        </div>
      )}

      {/* Members table */}
      <div className="content-card">
        <h2>All Members ({members.length})</h2>

        {/* Search */}
        <input
          type="search"
          placeholder="Search by name, email, phone, or ID..."
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          aria-label="Search members"
          style={{
            width: "100%",
            maxWidth: "420px",
            padding: "11px 12px",
            marginTop: "16px",
            marginBottom: "16px",
            border: "1px solid #d1d5db",
            borderRadius: "8px",
            fontSize: "14px",
            boxSizing: "border-box",
          }}
        />

        {filteredMembers.length === 0 ? (
          <p style={{ color: "#64748b", marginTop: "16px" }}>
            {members.length === 0
              ? 'No members found. Click "+ Add Member" to register your first member.'
              : "No members match your search."}
          </p>
        ) : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Member Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Actions</th>
                </tr>
              </thead>

              <tbody>
                {filteredMembers.map((member) => (
                  <tr key={member.id}>
                    <td>{member.id}</td>

                    <td>
                      <strong>{member.name}</strong>
                    </td>

                    <td>{member.email}</td>

                    <td>{member.phone || "—"}</td>

                    <td>
                      <button
                        type="button"
                        onClick={() => handleEdit(member)}
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

export default Members;