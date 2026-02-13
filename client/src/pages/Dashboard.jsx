import { useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import axios from 'axios';
import { MapPin, Filter, ArrowLeft, History, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import BottomNav from '../components/BottomNav';

const Dashboard = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [attendance, setAttendance] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [timer, setTimer] = useState('00 hrs 00 mins');
    const [address, setAddress] = useState('Fetching location...');
    const [reason, setReason] = useState('');

    // Determined if currently checked in based on the presence of checkIn but no checkOut
    // The backend `getStatus` ensures that if there is an open session, checkOut is null.
    const isCheckedIn = attendance?.checkIn && !attendance.checkOut;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const statusRes = await axios.get('http://localhost:5000/api/attendance/status', {
                    withCredentials: true 
                });
                setAttendance(statusRes.data);

                const historyRes = await axios.get('http://localhost:5000/api/attendance/history', {
                    withCredentials: true
                });
                setHistory(historyRes.data);
            } catch (err) {
                console.error(err);
                if (err.response && err.response.status === 401) {
                    logout();
                }
            }
        };

        fetchData();
    }, [logout]);

    // Timer Logic
    useEffect(() => {
        let interval;
        const updateTimer = () => {
            if (!attendance) {
                setTimer('00 hrs 00 mins');
                return;
            }

            let totalMs = 0;
            
            if (attendance.sessions && Array.isArray(attendance.sessions)) {
                // Calculate from sessions array for accuracy across multiple sessions
                attendance.sessions.forEach(session => {
                    const checkInTime = new Date(session.checkIn.time);
                    if (session.checkOut && session.checkOut.time) {
                        // Completed session
                        totalMs += new Date(session.checkOut.time) - checkInTime;
                    } else if (session.checkIn && (!session.checkOut || !session.checkOut.time)) {
                         // Current open session
                         totalMs += new Date() - checkInTime;
                    }
                });
            } else {
                 // Fallback if sessions array is missing but root fields exist (backward compatibility or empty day)
                 if (attendance.checkIn && !attendance.checkOut) {
                      totalMs = new Date() - new Date(attendance.checkIn.time);
                 } else if (attendance.totalHours) {
                      // If completely checked out and backend provided totalHours
                      totalMs = attendance.totalHours * 1000 * 60 * 60;
                 }
            }

            const hours = Math.floor(totalMs / (1000 * 60 * 60));
            const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
            setTimer(`${hours} hrs ${minutes} mins`);
        };

        updateTimer(); // Initial run
        interval = setInterval(updateTimer, 60000); // Update every minute
        return () => clearInterval(interval);
    }, [attendance]);

    // Address Logic
    useEffect(() => {
        const fetchAddress = async () => {
            if (attendance?.checkIn?.location) {
                try {
                    const { lat, lng } = attendance.checkIn.location;
                    const res = await axios.get(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                    setAddress(res.data.display_name.split(',')[0] + ', ' + res.data.display_name.split(',')[1]); 
                } catch (error) {
                    setAddress('Location available');
                }
            } else {
                setAddress('Location pending...');
            }
        };
        fetchAddress();
    }, [attendance]);

    const getLocation = () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
            } else {
                navigator.geolocation.getCurrentPosition(
                    (position) => {
                        resolve({
                            lat: position.coords.latitude,
                            lng: position.coords.longitude
                        });
                    },
                    (error) => {
                        reject(error);
                    }
                );
            }
        });
    };

    const handleCheckIn = async () => {
        setLoading(true);
        setError('');
        try {
            const location = await getLocation();
            const { data } = await axios.post('http://localhost:5000/api/attendance/check-in', {
                location,
                reason: reason || 'Standard Check-in' 
            }, { withCredentials: true });
            
            setAttendance(data);
            setReason(''); // Clear reason after success
            
            // Refresh history immediately to show the new 'At Work' status if needed, 
            // though usually history shows *completed* days or summarized days.
            const historyRes = await axios.get('http://localhost:5000/api/attendance/history', {
                 withCredentials: true
            });
            setHistory(historyRes.data);
        } catch (err) {
            console.error(err);
             if (err.code === 1) {
                setError('Location access denied. Please allow location access.');
            } else if (err.response && err.response.status === 401) {
                logout();
            } else {
                setError(err.response?.data?.message || err.message || 'Check-in failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleCheckOut = async () => {
        setLoading(true);
        setError('');
        try {
            const location = await getLocation();
            const { data } = await axios.post('http://localhost:5000/api/attendance/check-out', {
                location,
                 reason: reason || 'Standard Check-out'
            }, { withCredentials: true });
            
            setAttendance(data);
            setReason(''); // Clear reason after success
             const historyRes = await axios.get('http://localhost:5000/api/attendance/history', {
                 withCredentials: true
            });
            setHistory(historyRes.data);
        } catch (err) {
            console.error(err);
            if (err.code === 1) {
                setError('Location access denied.');
            } else if (err.response && err.response.status === 401) {
                logout();
            } else {
                setError(err.response?.data?.message || err.message || 'Check-out failed');
            }
        } finally {
            setLoading(false);
        }
    };

    const formatTime = (dateString) => {
        if (!dateString) return '--:--';
        return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getDayLabel = (dateString) => {
        const date = new Date(dateString);
        const today = new Date();
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        if (date.toDateString() === today.toDateString()) return 'Today';
        if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    };

    const calculateDailyTotal = (record) => {
        let totalMs = 0;
        if (record.sessions && Array.isArray(record.sessions)) {
            record.sessions.forEach(session => {
                if (session.checkIn && session.checkIn.time && session.checkOut && session.checkOut.time) {
                    totalMs += new Date(session.checkOut.time) - new Date(session.checkIn.time);
                }
            });
        } else if (record.totalHours) {
            totalMs = record.totalHours * 1000 * 60 * 60;
        }
        
        const hours = Math.floor(totalMs / (1000 * 60 * 60));
        const minutes = Math.floor((totalMs % (1000 * 60 * 60)) / (1000 * 60));
        return `${hours}h ${minutes}m`;
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans">
            {/* Header */}
            <div className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div 
                    className="flex items-center text-gray-800 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={20} className="mr-2" />
                    <span className="font-semibold text-lg">Back</span>
                </div>
                <div className="w-10 h-10 rounded-full bg-gray-300 overflow-hidden">
                    <img src={`https://ui-avatars.com/api/?name=${user.name}&background=random`} alt="User" />
                </div>
            </div>

            <div className="p-4">
                {/* Main Action Card */}
                <div className="bg-white rounded-3xl p-6 shadow-lg mb-6 relative overflow-hidden">
                    {/* Background decorations */}
                     <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full z-0 pointer-events-none"></div>

                    <div className="flex justify-between items-start mb-4 relative z-10">
                        <div>
                             <p className="text-gray-500 text-xs font-bold tracking-wider uppercase mb-1">
                                {isCheckedIn ? 'Checked in for' : 'Total Hours Today'}
                            </p>
                             <div className="text-4xl font-bold text-gray-800 flex items-baseline">
                                {timer.split(' ').map((part, i) => (
                                    <span key={i} className={i % 2 === 0 ? "text-4xl mr-1" : "text-sm text-gray-500 mr-2 font-normal"}>{part}</span>
                                ))}
                             </div>
                        </div>
                        <div className="text-right">
                             {isCheckedIn ? (
                                attendance.checkIn.status === 'Pending' ? (
                                    <span className="bg-yellow-100 text-yellow-600 px-3 py-1 rounded-full text-xs font-semibold block mb-1">
                                        Pending Approval
                                    </span>
                                ) : (
                                    <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-full text-xs font-semibold block mb-1">
                                        At work
                                    </span>
                                )
                             ) : (
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-semibold block mb-1">
                                    Not Working
                                </span>
                             )}
                        </div>
                    </div>

                    <div className="flex items-center text-gray-500 text-sm mb-4 relative z-10">
                        <MapPin size={16} className="mr-1 flex-shrink-0" />
                        <span className="truncate max-w-[250px]">{address}</span>
                    </div>

                    <div className="relative z-10 mb-4">
                        <input 
                            type="text" 
                            placeholder="Add a note (optional)..." 
                            className="w-full bg-gray-50 border border-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-100 transition-all"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                        />
                    </div>

                    {error && <div className="text-red-500 text-sm mb-2">{error}</div>}

                    {isCheckedIn ? (
                         <button 
                            onClick={handleCheckOut}
                            disabled={loading}
                            className="w-full bg-teal-500 text-white font-bold py-4 rounded-xl shadow-md hover:bg-teal-600 transition-colors uppercase tracking-wider"
                        >
                            {loading ? 'Processing...' : 'Check Out'}
                        </button>
                    ) : (
                        <button 
                            onClick={handleCheckIn}
                            disabled={loading}
                            className="w-full bg-blue-600 text-white font-bold py-4 rounded-xl shadow-md hover:bg-blue-700 transition-colors uppercase tracking-wider"
                        >
                            {loading ? 'Processing...' : 'Check In'}
                        </button>
                    )}
                </div>

                <div className="flex justify-between items-center mb-4 px-2">
                    <h3 className="text-gray-500 text-sm font-bold tracking-wider uppercase">Recent Activity</h3>
                    <div className="flex space-x-3 items-center">
                         <button 
                            onClick={async () => {
                                try {
                                    const { data } = await axios.get('http://localhost:5000/api/attendance/history-range', { withCredentials: true });
                                    
                                    const exportData = data.map(record => ({
                                        "Date": new Date(record.date).toLocaleDateString(),
                                        "Status": record.status,
                                        "Total Hours": record.totalHours ? record.totalHours.toFixed(2) : '0.00',
                                        "Check In": record.sessions?.[0]?.checkIn?.time ? new Date(record.sessions[0].checkIn.time).toLocaleTimeString() : '',
                                        "Check Out": record.sessions?.[record.sessions.length-1]?.checkOut?.time ? new Date(record.sessions[record.sessions.length-1].checkOut.time).toLocaleTimeString() : ''
                                    }));

                                    const worksheet = XLSX.utils.json_to_sheet(exportData);
                                    const workbook = XLSX.utils.book_new();
                                    XLSX.utils.book_append_sheet(workbook, worksheet, "My Attendance");
                                    XLSX.writeFile(workbook, "my_attendance.xlsx");
                                } catch (e) { alert('Export failed'); }
                            }}
                            className="text-xs text-blue-600 font-bold flex items-center bg-blue-50 px-2 py-1 rounded"
                        >
                            <Download size={12} className="mr-1" /> Export
                        </button>
                    </div>
                </div>

                {/* History List */}
                <div className="space-y-4">
                    {history.map((record) => (
                        <div key={record._id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                            <div className="flex justify-between items-center mb-3">
                                <div>
                                    <h4 className="font-bold text-gray-800">{getDayLabel(record.date)}</h4>
                                    <span className="text-xs text-gray-400 font-medium">Total: {calculateDailyTotal(record)}</span>
                                </div>
                                <span className={`text-xs font-semibold px-2 py-1 rounded ${record.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                                    {record.status}
                                </span>
                            </div>
                            
                            <div className="space-y-3">
                                {/* Display Sessions */}
                                {record.sessions && record.sessions.length > 0 ? (
                                    record.sessions.map((session, idx) => (
                                        <div key={idx} className="bg-gray-50 p-2 rounded-lg text-sm border border-gray-100">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="text-gray-700 font-medium">
                                                    <span>{formatTime(session.checkIn.time)}</span>
                                                    <span className="mx-2 text-gray-400">→</span>
                                                    <span>{session.checkOut ? formatTime(session.checkOut.time) : '...'}</span>
                                                </div>
                                                {session.reason && (
                                                    <span className="text-[10px] bg-white px-1 border rounded text-gray-500 max-w-[80px] truncate">{session.reason}</span>
                                                )}
                                            </div>
                                            {session.checkIn?.location && (
                                                 <div className="flex items-start text-gray-400 text-[10px]">
                                                    <MapPin size={10} className="mr-1 mt-0.5 flex-shrink-0" />
                                                    <span className="truncate w-full">
                                                        {session.checkIn.location.address || `${session.checkIn.location.lat.toFixed(4)}, ${session.checkIn.location.lng.toFixed(4)}`}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-gray-600">
                                        <span>{formatTime(record.checkIn?.time)}</span>
                                        <span className="mx-2 text-gray-300">-</span>
                                        <span>{record.checkOut ? formatTime(record.checkOut.time) : '...'}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))}
                    {history.length === 0 && <p className="text-center text-gray-400 py-8">No attendance history found.</p>}
                </div>
            </div>

            <BottomNav />
        </div>
    );
};

export default Dashboard;
