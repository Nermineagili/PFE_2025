import { useEffect, useState } from "react";
import axios from "axios";
import { Table, Button, Form, Modal, Alert, Spinner, Container, Card, OverlayTrigger, Tooltip } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import { FaRegEdit, FaRegTrashAlt, FaPlus, FaCheck } from "react-icons/fa";
import "./TaskManager.css";

const API_BASE_URL = "http://localhost:5000/api/tasks";

interface Task {
  _id: string;
  title: string;
  description: string;
  createdAt?: string; // Made optional with ?
}

interface TaskInput {
  title: string;
  description: string;
}

function TaskManager() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newTask, setNewTask] = useState<TaskInput>({ 
    title: "", 
    description: "" 
  });
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState<string | null>(null);
  const navigate = useNavigate();

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      const response = await axios.get<Task[]>(API_BASE_URL, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(response.data);
    } catch (err) {
      console.error("Error fetching tasks:", err);
      setError("Failed to fetch tasks. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleTaskSubmit = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      if (isEditing && currentTaskId) {
        const response = await axios.put(
          `${API_BASE_URL}/${currentTaskId}`,
          newTask,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasks(tasks.map(task => 
          task._id === currentTaskId ? response.data.updatedTask : task
        ));
      } else {
        const response = await axios.post(
          API_BASE_URL,
          newTask,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setTasks([...tasks, response.data.newTask]);
      }
      
      setShowModal(false);
      resetForm();
    } catch (err) {
      console.error("Error saving task:", err);
      alert(`Failed to ${isEditing ? "update" : "add"} task.`);
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!window.confirm("Are you sure you want to delete this task?")) return;
  
    try {
      const token = localStorage.getItem("authToken");
      if (!token) throw new Error("No authentication token found.");

      await axios.delete(`${API_BASE_URL}/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTasks(tasks.filter(task => task._id !== taskId));
    } catch (err) {
      console.error("Error deleting task:", err);
      alert("Failed to delete task.");
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewTask(prev => ({ ...prev, [name]: value }));
  };

  const openEditModal = (task: Task) => {
    setNewTask({
      title: task.title,
      description: task.description
    });
    setCurrentTaskId(task._id);
    setIsEditing(true);
    setShowModal(true);
  };

  const resetForm = () => {
    setNewTask({ title: "", description: "" });
    setCurrentTaskId(null);
    setIsEditing(false);
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  return (
    <Container className="task-manager-container">
      <Card className="task-manager-card">
        <Card.Body>
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="task-manager-title">Tâches à faire</h2>
            <Button 
              variant="primary" 
              onClick={() => setShowModal(true)}
              className="add-task-button"
            >
              <FaPlus className="me-2" />
              Add Task
            </Button>
          </div>

          {loading && (
            <div className="text-center py-4">
              <Spinner animation="border" variant="primary" />
            </div>
          )}

          {error && (
            <Alert variant="danger" className="text-center">
              {error}
            </Alert>
          )}

          {!loading && !error && tasks.length === 0 && (
            <Alert variant="info" className="text-center">
              No tasks found. Create your first task!
            </Alert>
          )}

          {!loading && !error && tasks.length > 0 && (
            <div className="table-responsive">
              <Table hover className="task-table">
                <thead>
                  <tr>
                    <th>Titre</th>
                    <th>Description</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.map(task => (
                    <tr key={task._id}>
                      <td className="task-title">{task.title}</td>
                      <td className="task-description">{task.description}</td>
                      <td className="actions-cell">
                        <OverlayTrigger overlay={<Tooltip id={`edit-tooltip-${task._id}`}>Edit Task</Tooltip>}>
                          <Button
                            size="sm"
                            className="action-btn analyze-btn"
                            onClick={() => openEditModal(task)}
                          >
                            <FaRegEdit />
                          </Button>
                        </OverlayTrigger>
                        <OverlayTrigger overlay={<Tooltip id={`delete-tooltip-${task._id}`}>Delete Task</Tooltip>}>
                          <Button
                            size="sm"
                            className="action-btn delete-btn"
                            onClick={() => deleteTask(task._id)}
                          >
                            <FaRegTrashAlt />
                          </Button>
                        </OverlayTrigger>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Task Modal */}
      <Modal 
        show={showModal} 
        onHide={() => { setShowModal(false); resetForm(); }} 
        centered
        className="task-modal"
      >
        <Modal.Header closeButton className="modal-header">
          <Modal.Title className="modal-title">
            {isEditing ? "Edit Task" : "Create New Task"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body className="modal-body">
          <Form className="task-form">
            <Form.Group className="form-group">
              <Form.Label className="form-label">Title</Form.Label>
              <Form.Control
                type="text"
                name="title"
                value={newTask.title}
                onChange={handleInputChange}
                placeholder="Enter task title"
                className="form-input"
              />
            </Form.Group>
            
            <Form.Group className="form-group">
              <Form.Label className="form-label">Description</Form.Label>
              <Form.Control
                as="textarea"
                name="description"
                value={newTask.description}
                onChange={handleInputChange}
                rows={4}
                placeholder="Enter task description"
                className="form-textarea"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer className="modal-footer">
          <Button 
            variant="secondary" 
            onClick={() => { setShowModal(false); resetForm(); }}
            className="close-button"
          >
            Cancel
          </Button>
          <Button 
            variant="primary" 
            onClick={handleTaskSubmit}
            className="submit-button"
          >
            {isEditing ? (
              <>
                <FaCheck className="button-icon" />
                Update Task
              </>
            ) : (
              <>
                <FaPlus className="button-icon" />
                Create Task
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}

export default TaskManager;