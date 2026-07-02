import React, { useState, useEffect } from 'react';
import api from '../../services/api';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      const response = await api.get('/api/admin/users');
      setUsers(response.data);
      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch users", error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✅ Block Logic
  const handleBlock = async (id) => {
    if (window.confirm("Are you sure you want to block this user?")) {
       try {
           await api.put(`/api/admin/users/${id}/block`);
           setUsers(users.map(u => 
               u.id === id ? { ...u, role: "ROLE_BLOCKED" } : u
           ));
       } catch (error) {
           console.error("Failed to block user", error);
           alert("Failed to block user.");
       }
    }
  };

  // ✅ NEW: Unblock Logic
  const handleUnblock = async (id) => {
    if (window.confirm("Are you sure you want to unblock this user?")) {
       try {
           await api.put(`/api/admin/users/${id}/unblock`);
           // Revert role back to USER
           setUsers(users.map(u => 
               u.id === id ? { ...u, role: "ROLE_USER" } : u
           ));
       } catch (error) {
           console.error("Failed to unblock user", error);
           alert("Failed to unblock user.");
       }
    }
  };

  if (loading) return <div className="p-8 text-gray-500 dark:text-gray-400">Loading Customers...</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">My Customers</h2>
      
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden border border-gray-200 dark:border-gray-700">
        <table className="min-w-full leading-normal">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 uppercase text-xs">
              <th className="px-5 py-3 text-left">ID</th>
              <th className="px-5 py-3 text-left">Name</th>
              <th className="px-5 py-3 text-left">Email</th>
              <th className="px-5 py-3 text-left">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-400">#{user.id}</td>
                <td className="px-5 py-4 text-sm font-medium text-gray-900 dark:text-white">{user.name}</td>
                <td className="px-5 py-4 text-sm text-gray-500 dark:text-gray-300">{user.email}</td>
                <td className="px-5 py-4 text-sm">
                  {/* ✅ TOGGLE BUTTON: If blocked, show Unblock. If active, show Block. */}
                  {user.role === 'ROLE_BLOCKED' ? (
                      <button 
                        onClick={() => handleUnblock(user.id)}
                        className="text-green-600 hover:text-green-800 font-semibold border border-green-200 bg-green-50 px-3 py-1 rounded"
                      >
                        Unblock
                      </button>
                  ) : (
                      <button 
                        onClick={() => handleBlock(user.id)}
                        className="text-red-600 hover:text-red-800 font-semibold border border-red-200 bg-red-50 px-3 py-1 rounded"
                      >
                        Block
                      </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagementPage;