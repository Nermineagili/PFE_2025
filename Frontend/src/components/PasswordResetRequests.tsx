// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import { Button } from 'react-bootstrap';

// const PasswordResetRequests = () => {
//   const [requests, setRequests] = useState<any[]>([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchRequests = async () => {
//       try {
//         const response = await axios.get('/api/auth/pending-reset-requests');
//         setRequests(response.data);
//       } catch (error) {
//         console.error('Error fetching reset requests:', error);
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     fetchRequests();
//   }, []);

//   const handleApprove = async (userId: string, token: string) => {
//     try {
//       await axios.get(`/api/auth/approve-reset/${token}/${userId}`);
//       setRequests(requests.filter(req => req.userId !== userId));
//       // Show success message or refresh list
//     } catch (error) {
//       console.error('Approval failed:', error);
//     }
//   };

//   if (loading) return <div>Loading requests...</div>;

//   return (
//     <div className="reset-requests-card card">
//       <div className="card-header">
//         Password Reset Requests
//       </div>
//       <div className="card-body">
//         {requests.length === 0 ? (
//           <p>No pending requests</p>
//         ) : (
//           <div className="reset-requests-list">
//             {requests.map((request) => (
//               <div key={request._id} className="reset-request-item">
//                 <div>
//                   <strong>{request.name}</strong> ({request.email})
//                   <div className="text-muted small">
//                     Requested at: {new Date(request.requestedAt).toLocaleString()}
//                   </div>
//                 </div>
//                 <div className="reset-request-actions">
//                   <button 
//                     className="btn-approve"
//                     onClick={() => handleApprove(request.userId, request.token)}
//                   >
//                     Approve
//                   </button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default PasswordResetRequests;