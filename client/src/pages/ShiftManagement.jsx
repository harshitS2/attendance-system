import { useState, useEffect } from 'react';
import axios from 'axios';

const ShiftManagement = () => {
    const [users, setUsers] = useState([]);
    const [shifts, setShifts] = useState([]);
    const [formData, setFormData] = useState({
        userId: '',
        shiftType: 'Morning',
        startTime: '09:00',
        endTime: '17:00',
        effectiveDate: '',
        endDate: ''
    });
    const [msg, setMsg] = useState('');

    useEffect(() => {
        fetchUsers();
        fetchShifts();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/users`, { withCredentials: true });
            setUsers(data);
            if (data.length > 0) setFormData(prev => ({ ...prev, userId: data[0]._id }));
        } catch (error) {
            console.error(error);
        }
    };

    const fetchShifts = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/shifts/team`, { withCredentials: true });
            setShifts(data);
        } catch (error) {
            console.error(error);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await axios.post(`${import.meta.env.VITE_API_URL}/shifts`, formData, { withCredentials: true });
            setMsg('Shift assigned successfully');
            fetchShifts();
            setTimeout(() => setMsg(''), 3000);
        } catch (error) {
             console.error(error);
             setMsg('Failed to assign shift');
        }
    };

    return (
        <div className="container mx-auto p-4">
            <h1 className="text-2xl font-bold mb-4">Shift Management</h1>
            {msg && <div className="bg-blue-100 text-blue-700 p-2 rounded mb-4">{msg}</div>}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Assign Shift</h2>
                    <form onSubmit={handleSubmit}>
                         <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Employee</label>
                            <select 
                                className="w-full p-2 border rounded"
                                value={formData.userId}
                                onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                                required
                            >
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Shift Type</label>
                            <select 
                                className="w-full p-2 border rounded"
                                value={formData.shiftType}
                                onChange={(e) => setFormData({ ...formData, shiftType: e.target.value })}
                            >
                                <option value="Morning">Morning</option>
                                <option value="Evening">Evening</option>
                                <option value="Night">Night</option>
                            </select>
                        </div>
                         <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-gray-700 mb-2">Start Time</label>
                                <input 
                                    type="time" 
                                    className="w-full p-2 border rounded"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-gray-700 mb-2">End Time</label>
                                <input 
                                    type="time" 
                                    className="w-full p-2 border rounded"
                                    value={formData.endTime}
                                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                                    required
                                />
                            </div>
                        </div>
                        <div className="mb-4">
                            <label className="block text-gray-700 mb-2">Effective Date</label>
                            <input 
                                type="date" 
                                className="w-full p-2 border rounded"
                                value={formData.effectiveDate}
                                onChange={(e) => setFormData({ ...formData, effectiveDate: e.target.value })}
                                required
                            />
                        </div>
                        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">
                            Assign Shift
                        </button>
                    </form>
                </div>

                <div className="bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-bold mb-4">Assigned Shifts</h2>
                    <ul>
                        {shifts.map(shift => (
                            <li key={shift._id} className="border-b py-2">
                                <p className="font-bold">{shift.userId?.name}</p>
                                <p className="text-sm text-gray-600">
                                    {shift.shiftType}: {shift.startTime} - {shift.endTime}
                                </p>
                                <p className="text-xs text-gray-500">Effective: {new Date(shift.effectiveDate).toLocaleDateString()}</p>
                            </li>
                        ))}
                        {shifts.length === 0 && <p>No shifts assigned.</p>}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default ShiftManagement;
