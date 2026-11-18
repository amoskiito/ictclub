import "./RegistrationList.css";

function RegistrationList({ students, onEdit, onDelete }) {
  return (
    <div className="registration-list-card">
      <h2>Registered Students</h2>
      <p className="registration-list-description">
        Below are the students registered for university ICT events.
      </p>

      {students.length === 0 ? (
        <p className="empty-message">No registrations found.</p>
      ) : (
        <div className="table-container">
          <table className="registration-table">
            <thead>
              <tr>
                <th>Student Name</th>
                <th>Department</th>
                <th>Event</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.department}</td>
                  <td>{student.event}</td>
                  <td className="action-cell">
                    <button className="edit-button" onClick={() => onEdit(student)}>
                      Edit
                    </button>
                    <button className="delete-button" onClick={() => onDelete(student)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default RegistrationList;
