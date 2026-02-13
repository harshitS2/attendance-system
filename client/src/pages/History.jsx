import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { ArrowLeft, Download, Filter, Calendar, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import BottomNav from '../components/BottomNav';

const History = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);
    const [filteredHistory, setFilteredHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [dateRange, setDateRange] = useState({ start: '', end: '' });

    useEffect(() => {
        fetchHistory();
    }, [logout]);

    const fetchHistory = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/attendance/history-range', {
                withCredentials: true
            });
            setHistory(data);
            setFilteredHistory(data);
        } catch (error) {
            console.error(error);
            if (error.response && error.response.status === 401) {
                logout();
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        let result = history;

        if (searchQuery) {
            result = result.filter(item => 
                new Date(item.date).toLocaleDateString().includes(searchQuery) ||
                item.status.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        if (dateRange.start) {
            result = result.filter(item => new Date(item.date) >= new Date(dateRange.start));
        }

        if (dateRange.end) {
            result = result.filter(item => new Date(item.date) <= new Date(dateRange.end));
        }

        setFilteredHistory(result);
    }, [searchQuery, dateRange, history]);

    const handleExport = () => {
        const exportData = filteredHistory.map(record => ({
            "Date": new Date(record.date).toLocaleDateString(),
            "Status": record.status,
            "Total Hours": record.totalHours ? record.totalHours.toFixed(2) : '0.00',
            "Check In": record.sessions?.[0]?.checkIn?.time ? new Date(record.sessions[0].checkIn.time).toLocaleTimeString() : '',
            "Check Out": record.sessions?.[record.sessions.length-1]?.checkOut?.time ? new Date(record.sessions[record.sessions.length-1].checkOut.time).toLocaleTimeString() : '',
            "Notes": record.sessions?.map(s => s.checkIn?.reason).join('; ') || ''
        }));

        const worksheet = XLSX.utils.json_to_sheet(exportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance History");
        XLSX.writeFile(workbook, "attendance_history.xlsx");
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans">
            <div className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div 
                    className="flex items-center text-gray-800 cursor-pointer"
                    onClick={() => navigate(-1)}
                >
                    <ArrowLeft size={20} className="mr-2" />
                    <span className="font-semibold text-lg">History</span>
                </div>
                <button 
                    onClick={handleExport}
                    className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 flex items-center text-xs font-bold"
                >
                    <Download size={16} className="mr-1" /> Export
                </button>
            </div>

            <div className="p-4 space-y-4">
                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm space-y-3">
                    <div className="flex items-center bg-gray-50 rounded-lg px-3 py-2">
                        <Search size={16} className="text-gray-400 mr-2" />
                        <input 
                            type="text" 
                            placeholder="Search status or date..." 
                            className="bg-transparent w-full text-sm focus:outline-none"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center bg-gray-50 rounded-lg px-2 py-2">
                            <span className="text-xs text-gray-400 mr-2">From</span>
                            <input 
                                type="date" 
                                className="bg-transparent w-full text-xs focus:outline-none"
                                value={dateRange.start}
                                onChange={(e) => setDateRange({...dateRange, start: e.target.value})}
                            />
                        </div>
                        <div className="flex items-center bg-gray-50 rounded-lg px-2 py-2">
                            <span className="text-xs text-gray-400 mr-2">To</span>
                            <input 
                                type="date" 
                                className="bg-transparent w-full text-xs focus:outline-none"
                                value={dateRange.end}
                                onChange={(e) => setDateRange({...dateRange, end: e.target.value})}
                            />
                        </div>
                    </div>
                </div>

                {/* Table View */}
                <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50 text-gray-500 uppercase text-xs font-bold">
                                <tr>
                                    <th className="px-4 py-3">Date</th>
                                    <th className="px-4 py-3 text-center">Status</th>
                                    <th className="px-4 py-3 text-right">Hours</th>
                                    <th className="px-4 py-3 hidden sm:table-cell">Times</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {loading ? (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-400">Loading records...</td>
                                    </tr>
                                ) : filteredHistory.length > 0 ? (
                                    filteredHistory.map((record) => (
                                        <tr key={record._id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-800">
                                                {new Date(record.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wide ${
                                                    record.status === 'Present' ? 'bg-green-100 text-green-700' :
                                                    record.status === 'Absent' ? 'bg-red-100 text-red-700' :
                                                    'bg-gray-100 text-gray-600'
                                                }`}>
                                                    {record.status}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-right font-mono text-gray-600">
                                                {record.totalHours ? record.totalHours.toFixed(1) : '-'}
                                            </td>
                                            <td className="px-4 py-3 hidden sm:table-cell text-xs text-gray-500">
                                                {record.sessions && record.sessions.length > 0 ? (
                                                     <div className="flex flex-col">
                                                        <span>In: {new Date(record.sessions[0].checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                        {record.sessions[record.sessions.length-1].checkOut && 
                                                            <span>Out: {new Date(record.sessions[record.sessions.length-1].checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                                                        }
                                                     </div>
                                                ) : '-'}
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-gray-400">No records found.</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <BottomNav />
        </div>
    );
};

export default History;
