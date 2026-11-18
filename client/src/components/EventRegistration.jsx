import { useState, useEffect } from "react";
import { api } from "../api";
import "./EventRegistration.css";

function EventRegistration({ onRegistrationSaved, editingStudent, onCancelEdit }) {
  const [name, setName] = useState("");
  const [regNumber, setRegNumber] = useState("");
  const [department, setDepartment] = useState("");
  const [event, setEvent] = useState("");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const isEditing = Boolean(editingStudent);

  // When a row's Edit button is clicked, load its values into the form
  useEffect(() => {
    if (editingStudent) {
      setName(editingStudent.name);
      setRegNumber(editingStudent.regNumber);
      setDepartment(editingStudent.department);
      setEvent(editingStudent.event);
      setMessage("");
    } else {
      setName("");
      setRegNumber("");
      setDepartment("");
      setEvent("");
    }
  }, [editingStudent]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setSaving(true);

    const studentData = { name, regNumber, department, event };
    const path = isEditing ? `/registrations/${editingStudent._id}` : "/registrations";

    try {
      const data = await api(path, { method: isEditing ? "PUT" : "POST", body: studentData });
      setMessage(data.message);
      setName("");
      setRegNumber("");
      setDepartment("");
      setEvent("");
      onRegistrationSaved();
    } catch (error) {
      setMessage(error.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="registration-card">
      <h2>{isEditing ? "Edit Registration" : "University ICT Club Event Registration"}</h2>
      <p className="registration-description">
        {isEditing
          ? "Update the details below and save your changes."
          : "Complete the form to register for an event."}
      </p>

      <form className="registration-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="studentName">Student Name</label>
          <input id="studentName" type="text" value={name}
            onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="regNumber">Registration Number</label>
          <input id="regNumber" type="text" value={regNumber}
            onChange={(e) => setRegNumber(e.target.value)} required />
        </div>

        <div className="form-group">
          <label htmlFor="department">Department</label>
          <select id="department" value={department}
            onChange={(e) => setDepartment(e.target.value)} required>
            <option value="">Select Department</option>
            <option value="Computer Science">Computer Science</option>
            <option value="Information Technology">Information Technology</option>
            <option value="Education">Education</option>
            <option value="Business">Business</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="event">Event</label>
          <select id="event" value={event}
            onChange={(e) => setEvent(e.target.value)} required>
            <option value="">Select Event</option>
            <option value="Cybersecurity Workshop">Cybersecurity Workshop</option>
            <option value="Web Development Bootcamp">Web Development Bootcamp</option>
            <option value="AI Innovation Day">AI Innovation Day</option>
          </select>
        </div>

        <div className="form-actions">
          <button className="submit-button" type="submit" disabled={saving}>
            {saving ? "Saving..." : isEditing ? "Save Changes" : "Submit Registration"}
          </button>
          {isEditing && (
            <button type="button" className="cancel-button" onClick={onCancelEdit}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {message && <p className="registration-message">{message}</p>}
    </div>
  );
}

export default EventRegistration;
