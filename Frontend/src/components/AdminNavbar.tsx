// import { useAuth } from '../context/AuthContext';
// import { Navbar, Container, Form, Button } from 'react-bootstrap';
// import './AdminNavbar.css'; // Import the CSS file

// function AdminNavbar() {
//   const { user } = useAuth();  // Get the user data from context

//   return (
//     <div className="sticky-navbar">
//       <Navbar expand="lg" style={{ backgroundColor: "#51565c" }}>
//         <Container fluid>
//           <Navbar.Toggle aria-controls="navbarScroll" />
//           <Navbar.Collapse id="navbarScroll">
//             <Navbar.Text style={{ color: "white" }}>
//               Signed in as: <a href="#login" style={{ color: "white" }}>
//                 {user?.fullname || "Guest"}  {/* Display full name if available, otherwise "Guest" */}
//               </a>
//             </Navbar.Text>
//             <Form className="d-flex">
//               <Form.Control
//                 type="search"
//                 placeholder="Search"
//                 className="me-2"
//                 aria-label="Search"
//               />
//               <Button variant="outline-success">Search</Button>
//             </Form>
//           </Navbar.Collapse>
//         </Container>
//       </Navbar>
//     </div>
//   );
// }

// export default AdminNavbar;