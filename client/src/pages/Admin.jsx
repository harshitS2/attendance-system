import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';

const Admin = () => {
    const [users, setUsers] = useState([]);
    const { user } = useContext(AuthContext);
    const [msg, setMsg] = useState('');

    useEffect(() => {
        const fetchUsers = async () => {
            try {
                const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/users`, { withCredentials: true });
                setUsers(data);
            } catch (error) {
                console.error(error);
            }
        };
        fetchUsers();
    }, []);

    const handleRoleChange = async (id, newRole) => {
        try {
            await axios.put(`${import.meta.env.VITE_API_URL}/users/${id}/role`, { role: newRole }, { withCredentials: true });
            setUsers(users.map(u => u._id === id ? { ...u, role: newRole } : u));
            setMsg('Role updated successfully');
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
            console.error(error);
            setMsg('Failed to update role');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Admin Panel</h1>
            {msg && <div className="bg-blue-100 text-blue-700 p-2 rounded mb-4">{msg}</div>}
            
            <div className="bg-white rounded shadow overflow-x-auto">
                <table className="min-w-full">
                    <thead className="bg-gray-200">
                        <tr>
                            <th className="py-2 px-4 text-left">Name</th>
                            <th className="py-2 px-4 text-left">Email</th>
                            <th className="py-2 px-4 text-left">Designation</th>
                            <th className="py-2 px-4 text-left">Role</th>
                            {user.role === 'SuperAdmin' && <th className="py-2 px-4 text-left">Actions</th>}
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(u => (
                            <tr key={u._id} className="border-b">
                                <td className="py-2 px-4">{u.name}</td>
                                <td className="py-2 px-4">{u.email}</td>
                                <td className="py-2 px-4">{u.designation}</td>
                                <td className="py-2 px-4">{u.role}</td>
                                {user.role === 'SuperAdmin' && (
                                    <td className="py-2 px-4">
                                        <select 
                                            value={u.role} 
                                            onChange={(e) => handleRoleChange(u._id, e.target.value)}
                                            className="border rounded p-1"
                                            disabled={u._id === user._id} // Prevent changing own role
                                        >
                                            <option value="Employee">Employee</option>
                                            <option value="TeamLead">TeamLead</option>
                                            <option value="Admin">Admin</option>
                                            <option value="SuperAdmin">SuperAdmin</option>
                                        </select>
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Admin;
