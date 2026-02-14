import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { ChevronLeft, ChevronRight, Calendar, Copy, Save, CheckCircle, AlertCircle } from 'lucide-react';
import AuthContext from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const ShiftManagement = () => {
    const { user } = useContext(AuthContext);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [weekStart, setWeekStart] = useState(getMonday(new Date()));
    const [weeklyShifts, setWeeklyShifts] = useState({});
    const [loading, setLoading] = useState(false);
    const [msg, setMsg] = useState({ type: '', text: '' });

    // Helper to get Monday of the current week
    function getMonday(d) {
        d = new Date(d);
        var day = d.getDay(),
            diff = d.getDate() - day + (day == 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(d.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        return monday;
    }

    // Helper to format date as YYYY-MM-DD in local time
    const formatDate = (date) => {
        const offset = date.getTimezoneOffset();
        const localDate = new Date(date.getTime() - (offset * 60 * 1000));
        return localDate.toISOString().split('T')[0];
    };

    // Generate array of 7 days starting from weekStart
    const getWeekDays = (startDate) => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const result = new Date(startDate);
            result.setDate(startDate.getDate() + i);
            days.push(result);
        }
        return days;
    };

    const weekDays = getWeekDays(weekStart);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        if (selectedUser && weekStart) {
            fetchUserShifts(selectedUser, weekStart);
        } else {
            // Reset shifts if no user selected
             const initialShifts = {};
             weekDays.forEach(day => {
                 const dateStr = formatDate(day);
                 initialShifts[dateStr] = {
                     shiftType: 'Morning',
                     startTime: '09:00',
                     endTime: '17:00',
                     isOff: false
                 };
             });
             setWeeklyShifts(initialShifts);
        }
    }, [selectedUser, weekStart]);

    const fetchUsers = async () => {
        try {
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/users`, { withCredentials: true });
            setUsers(data);
            if (data.length > 0) setSelectedUser(data[0]._id);
        } catch (error) {
            console.error(error);
        }
    };

    const fetchUserShifts = async (userId, startDate) => {
        setLoading(true);
        try {
            // ideally backend should support filtering, but for now we fetch all team shifts and filter
            const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/shifts/team`, { withCredentials: true });
            
            const relevantShifts = data.filter(s => s.userId._id === userId || s.userId === userId);
            
            const newWeeklyShifts = {};
            weekDays.forEach(day => {
                const dateStr = formatDate(day);
                const shift = relevantShifts.find(s => s.effectiveDate && s.effectiveDate.split('T')[0] === dateStr);
                
                if (shift) {
                    newWeeklyShifts[dateStr] = {
                        shiftType: shift.shiftType,
                        startTime: shift.startTime,
                        endTime: shift.endTime,
                        isOff: false 
                    };
                } else {
                    newWeeklyShifts[dateStr] = {
                        shiftType: 'Morning',
                        startTime: '09:00',
                        endTime: '17:00',
                        isOff: false // Default to working day if no record
                    };
                }
            });
            setWeeklyShifts(newWeeklyShifts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const handleShiftChange = (dateStr, field, value) => {
        setWeeklyShifts(prev => ({
            ...prev,
            [dateStr]: {
                ...prev[dateStr],
                [field]: value
            }
        }));
    };

    const copyMondayToAll = () => {
        const mondayStr = formatDate(weekDays[0]);
        const mondayShift = weeklyShifts[mondayStr];
        
        const newShifts = { ...weeklyShifts };
        weekDays.forEach((day, index) => {
            if (index === 0) return; // Skip Monday
            const dateStr = formatDate(day);
            newShifts[dateStr] = { ...mondayShift };
        });
        setWeeklyShifts(newShifts);
        showMsg('success', 'Copied Monday schedule to all days');
    };

    const saveShifts = async () => {
        setLoading(true);
        try {
            const shiftsPayload = Object.entries(weeklyShifts).map(([date, shift]) => ({
                date,
                ...shift
            }));

            await axios.post(`${import.meta.env.VITE_API_URL}/shifts/weekly`, {
                userId: selectedUser,
                weekStartDate: weekStart,
                shifts: shiftsPayload
            }, { withCredentials: true });

            showMsg('success', 'Weekly schedule saved successfully');
        } catch (error) {
            console.error(error);
            showMsg('error', 'Failed to save schedule');
        } finally {
            setLoading(false);
        }
    };

    const showMsg = (type, text) => {
        setMsg({ type, text });
        setTimeout(() => setMsg({ type: '', text: '' }), 3000);
    };

    const changeWeek = (offset) => {
        const newDate = new Date(weekStart);
        newDate.setDate(newDate.getDate() + (offset * 7));
        setWeekStart(newDate);
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-24 font-sans">
            <div className="bg-white p-4 shadow-sm sticky top-0 z-10">
                <h1 className="text-xl font-bold flex items-center text-gray-800">
                    <Calendar className="mr-2 text-blue-600" /> Shift Management
                </h1>
            </div>

            <div className="p-4 max-w-4xl mx-auto">
                {msg.text && (
                    <div className={`mb-4 p-3 rounded-xl flex items-center ${msg.type === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {msg.type === 'success' ? <CheckCircle size={20} className="mr-2"/> : <AlertCircle size={20} className="mr-2"/>}
                        {msg.text}
                    </div>
                )}

                {/* Controls */}
                <div className="bg-white p-6 rounded-3xl shadow-sm mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                        <div>
                            <label className="block text-gray-500 text-xs font-bold uppercase tracking-wider mb-2">Select Employee</label>
                            <select 
                                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-100"
                                value={selectedUser}
                                onChange={(e) => setSelectedUser(e.target.value)}
                            >
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                                ))}
                            </select>
                        </div>
                        
                        <div className="flex items-center justify-between bg-gray-50 p-2 rounded-xl border border-gray-200">
                            <button onClick={() => changeWeek(-1)} className="p-2 hover:bg-gray-200 rounded-lg transition"><ChevronLeft /></button>
                            <span className="font-semibold text-gray-700">
                                {weekDays[0].toLocaleDateString([], { month: 'short', day: 'numeric' })} - {weekDays[6].toLocaleDateString([], { month: 'short', day: 'numeric' })}
                            </span>
                            <button onClick={() => changeWeek(1)} className="p-2 hover:bg-gray-200 rounded-lg transition"><ChevronRight /></button>
                        </div>
                    </div>
                    
                    <div className="mt-6 flex justify-end">
                         <button 
                            onClick={copyMondayToAll}
                            className="text-blue-600 text-sm font-bold flex items-center hover:bg-blue-50 px-3 py-2 rounded-lg transition"
                        >
                            <Copy size={16} className="mr-2" /> Copy First Day to All
                        </button>
                    </div>
                </div>

                {/* Weekly Grid */}
                <div className="space-y-4">
                    {weekDays.map(day => {
                        const dateStr = formatDate(day);
                        const shift = weeklyShifts[dateStr] || {};
                        const isToday = new Date().toDateString() === day.toDateString();

                        return (
                            <div key={dateStr} className={`bg-white p-4 rounded-xl shadow-sm border ${isToday ? 'border-blue-300 ring-1 ring-blue-100' : 'border-gray-100'} transition-all hover:shadow-md`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div className="flex items-center gap-4 min-w-[150px]">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${shift.isOff ? 'bg-gray-300' : 'bg-blue-500'}`}>
                                            {day.getDate()}
                                        </div>
                                        <div>
                                            <p className="font-bold text-gray-800">{day.toLocaleDateString([], { weekday: 'long' })}</p>
                                            <p className="text-xs text-gray-500">{day.toLocaleDateString()}</p>
                                        </div>
                                    </div>

                                    <div className="flex-grow grid grid-cols-2 md:grid-cols-4 gap-3 items-center">
                                        <div className="flex items-center">
                                            <input 
                                                type="checkbox" 
                                                id={`off-${dateStr}`}
                                                className="w-4 h-4 text-blue-600 rounded mr-2"
                                                checked={shift.isOff || false}
                                                onChange={(e) => handleShiftChange(dateStr, 'isOff', e.target.checked)}
                                            />
                                            <label htmlFor={`off-${dateStr}`} className="text-sm text-gray-600 cursor-pointer">Day Off</label>
                                        </div>
                                        
                                        {!shift.isOff && (
                                            <>
                                                <select 
                                                    className="w-full p-2 bg-gray-50 border rounded-lg text-sm"
                                                    value={shift.shiftType || 'Morning'}
                                                    onChange={(e) => handleShiftChange(dateStr, 'shiftType', e.target.value)}
                                                >
                                                    <option value="Morning">Morning</option>
                                                    <option value="Evening">Evening</option>
                                                    <option value="Night">Night</option>
                                                </select>
                                                <input 
                                                    type="time" 
                                                    className="w-full p-2 bg-gray-50 border rounded-lg text-sm"
                                                    value={shift.startTime || ''}
                                                    onChange={(e) => handleShiftChange(dateStr, 'startTime', e.target.value)}
                                                />
                                                <input 
                                                    type="time" 
                                                    className="w-full p-2 bg-gray-50 border rounded-lg text-sm"
                                                    value={shift.endTime || ''}
                                                    onChange={(e) => handleShiftChange(dateStr, 'endTime', e.target.value)}
                                                />
                                            </>
                                        )}
                                        {shift.isOff && <div className="col-span-3 text-center text-gray-400 text-sm italic">No shift assigned</div>}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-8 flex justify-end sticky bottom-24">
                    <button 
                        onClick={saveShifts} 
                        disabled={loading}
                        className="bg-blue-600 text-white font-bold py-3 px-8 rounded-full shadow-lg hover:bg-blue-700 transition-colors flex items-center"
                    >
                        {loading ? 'Saving...' : <><Save size={20} className="mr-2" /> Save Schedule</>}
                    </button>
                </div>
            </div>
            
             <BottomNav />
        </div>
    );
};

export default ShiftManagement;

