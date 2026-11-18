import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { api } from "../api";
import { useAuth } from "../auth/AuthContext";
import { useTitle } from "./ui";
import EventRegistration from "./EventRegistration";
import RegistrationList from "./RegistrationList";
import "./dashboard.css";

function Dashboard() {
  useTitle("Dashboard");
  const { user, isOfficer } = useAuth();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingStudent, setEditingStudent] = useState(null); // record being edited

  const fetchRegistrations = async () => {
    try {
      setError("");
      setStudents(await api("/registrations"));
    } catch (err) {
      setError(err.message || "Unable to load registrations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const handleSaved = () => {
    setEditingStudent(null);   // leave edit mode after create/update
    fetchRegistrations();      // refresh the table
  };

  const handleDelete = async (student) => {
    if (!window.confirm(`Delete registration for ${student.name}?`)) return;
    try {
      await api(`/registrations/${student._id}`, { method: "DELETE" });
      if (editingStudent && editingStudent._id === student._id) setEditingStudent(null);
      fetchRegistrations();
    } catch (err) {
      setError(err.message || "Unable to delete registration");
    }
  };

  return (
    <div className="dashboard">
      <div className="dashboard-container">
        <div className="dashboard-header">
          <h1>University ICT Club Dashboard</h1>
          <p>Welcome, {user.name.split(" ")[0]}! Register for upcoming events and view students who have registered.</p>
          <div className="dash-links">
            <Link to="/events">Browse events</Link>
            <Link to="/my-events">My events</Link>
            <Link to="/profile">My profile</Link>
            {isOfficer && <Link to="/admin">Admin</Link>}
          </div>
        </div>

        <EventRegistration
          onRegistrationSaved={handleSaved}
          editingStudent={editingStudent}
          onCancelEdit={() => setEditingStudent(null)}
        />

        {loading ? (
          <div className="dashboard-status">Loading registrations...</div>
        ) : error ? (
          <div className="dashboard-status dashboard-error">{error}</div>
        ) : (
          <RegistrationList
            students={students}
            onEdit={setEditingStudent}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
}

export default Dashboard;
