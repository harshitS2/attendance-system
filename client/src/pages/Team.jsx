import { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import AuthContext from '../context/AuthContext';
import { ArrowLeft, UserCircle, X, CheckCircle, AlertCircle, Clock, MapPin, Download, Lock } from 'lucide-react';
import * as XLSX from 'xlsx';
import BottomNav from '../components/BottomNav';

const Team = () => {
    const { user, logout } = useContext(AuthContext);
    const [teamData, setTeamData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedMember, setSelectedMember] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [manualTime, setManualTime] = useState('');
    const [reason, setReason] = useState('');
    const [error, setError] = useState('');

    const isAdmin = user && ['Admin', 'SuperAdmin'].includes(user.role);

    useEffect(() => {
        fetchTeamData();
    }, [logout]);

    const fetchTeamData = async () => {
         try {
            const { data } = await axios.get('http://localhost:5000/api/attendance/live-status', {
                withCredentials: true
            });
            setTeamData(data);
         } catch (error) {
             console.error(error);
             if (error.response && error.response.status === 401) {
                 logout();
             }
         } finally {
             setLoading(false);
         }
    };

    const handleMemberClick = (member) => {
        if (!isAdmin) return;
        setSelectedMember(member);
        setManualTime(new Date().toISOString().slice(0, 16)); // Default to now (YYYY-MM-DDTHH:mm)
        setReason('');
        setError('');
    };

    const closeMemberModal = () => {
        setSelectedMember(null);
        setActiveTab('actions'); // Reset tab
        setMemberHistory([]);
    };

    const [memberHistory, setMemberHistory] = useState([]);
    const [historyLoading, setHistoryLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('actions');
    const [editForm, setEditForm] = useState({
        name: '',
        designation: '',
        employeeId: '',
        role: ''
    });

    const handleAdminAction = async (actionType) => {
        if (!selectedMember) return;
        setActionLoading(true);
        setError('');

        try {
            const endpoint = actionType === 'checkIn' ? 'check-in' : 'check-out';
            await axios.post(`http://localhost:5000/api/attendance/${endpoint}`, {
                userId: selectedMember.userId._id,
                manualTime: manualTime ? new Date(manualTime) : new Date(),
                reason: reason || `Admin manual ${actionType === 'checkIn' ? 'Check-in' : 'Check-out'}`,
                location: { lat: 0, lng: 0, address: 'Manual Admin Entry' } // Placeholder location
            }, { withCredentials: true });

            // Refresh data
            await fetchTeamData();
            closeMemberModal();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Action failed');
        } finally {
            setActionLoading(false);
        }
    };

    const fetchMemberHistory = async (userId) => {
        setHistoryLoading(true);
        try {
            const { data } = await axios.get(`http://localhost:5000/api/attendance/history/${userId}`, {
                withCredentials: true
            });
            setMemberHistory(data);
        } catch (error) {
            console.error('Error fetching history:', error);
        } finally {
            setHistoryLoading(false);
        }
    };

    const handleUpdateUser = async () => {
        setActionLoading(true);
        setError('');
        try {
            await axios.put(`http://localhost:5000/api/users/${selectedMember.userId._id}`, editForm, {
                withCredentials: true
            });
            await fetchTeamData();
            closeMemberModal();
        } catch (err) {
            console.error(err);
            setError(err.response?.data?.message || 'Update failed');
        } finally {
            setActionLoading(false);
        }
    };
    
    // When member is selected, sync edit form
    useEffect(() => {
        if (selectedMember) {
            setEditForm({
                name: selectedMember.userId.name,
                designation: selectedMember.userId.designation,
                employeeId: selectedMember.userId.employeeId || '', // Handle missing employeeId
                role: selectedMember.userId.role
            });
            if (activeTab === 'history') {
                fetchMemberHistory(selectedMember.userId._id);
            }
        }
    }, [selectedMember, activeTab]);



    const handleApprove = async () => {
         if (!selectedMember || !selectedMember.sessionId) {
              alert('Cannot approve: No session ID');
              return;
         }
         setActionLoading(true);
         try {
             await axios.post('http://localhost:5000/api/attendance/approve-session', {
                 attendanceId: selectedMember.attendanceId,
                 sessionId: selectedMember.sessionId
             }, { withCredentials: true });
             await fetchTeamData();
             closeMemberModal();
         } catch (error) {
             setError('Approval failed');
         } finally {
             setActionLoading(false);
         }
    };

    const handleExport = async () => {
        try {
            const { data } = await axios.get('http://localhost:5000/api/attendance/history-range', {
                withCredentials: true
            });
            
            // Flatten Data for Excel
            const exportData = data.map(record => {
                 // Note: The history-range endpoint currently returns Attendance documents.
                 // It might NOT have userId populated with name/employeeId if we didn't update the controller to populate it.
                 // Let's quickly check controller... getHistoryRange calls Attendance.find(query).sort(...)
                 // It does NOT populate. We should fix controller OR fetch users separately.
                 // Since I cannot change backend in this atomic step easily without context switch, 
                 // I will assume for now we might only get userId string.
                 // But wait, "Beautifully designed" implies names.
                 // I really should populate in backend. 
                 // However, for this step, let's just dump what we have and maybe the ID is enough or the frontend has the user list?
                 // Team page HAS `teamData` which has all users. I can map userId to names!
                 
                 const user = teamData.find(m => m.userId._id === record.userId || m.userId._id === record.userId?._id)?.userId;
                 
                 return {
                     "Date": new Date(record.date).toLocaleDateString(),
                     "Employee Name": user?.name || 'Unknown',
                     "Employee ID": user?.employeeId || 'N/A',
                     "Status": record.status,
                     "Total Hours": record.totalHours ? record.totalHours.toFixed(2) : '0.00',
                     "Check In": record.sessions?.[0]?.checkIn?.time ? new Date(record.sessions[0].checkIn.time).toLocaleTimeString() : '',
                     "Check Out": record.sessions?.[record.sessions.length-1]?.checkOut?.time ? new Date(record.sessions[record.sessions.length-1].checkOut.time).toLocaleTimeString() : '',
                     "Notes": record.sessions?.map(s => s.checkIn?.reason).join('; ') || ''
                 };
            });

            const worksheet = XLSX.utils.json_to_sheet(exportData);
            const workbook = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
            
            // Auto-width columns (simple estimation)
            const wscols = [
                {wch: 12}, // Date
                {wch: 20}, // Name
                {wch: 15}, // ID
                {wch: 10}, // Status
                {wch: 10}, // Hours
                {wch: 15}, // In
                {wch: 15}, // Out
                {wch: 30}  // Notes
            ];
            worksheet['!cols'] = wscols;

            XLSX.writeFile(workbook, "attendance_export.xlsx");
        } catch (error) {
            console.error(error);
            alert('Export failed');
        }
    };

    const [newPassword, setNewPassword] = useState('');
    const handleResetPassword = async () => {
        if (!newPassword) return;
        setActionLoading(true);
        try {
             await axios.put(`http://localhost:5000/api/users/${selectedMember.userId._id}/password`, { password: newPassword }, {
                 withCredentials: true
             });
             setNewPassword('');
             alert('Password reset successfully');
        } catch (error) {
            setError('Password reset failed');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div className="bg-gray-50 min-h-screen pb-20 font-sans relative">
            <div className="bg-white p-4 flex justify-between items-center shadow-sm sticky top-0 z-10">
                <div className="flex items-center space-x-2">
                    <span className="font-semibold text-lg">Team Status</span>
                    {isAdmin && (
                        <button 
                            onClick={() => handleExport()}
                            className="p-1 bg-blue-50 text-blue-600 rounded hover:bg-blue-100" 
                            title="Export All Data"
                        >
                            <Download size={18} />
                        </button>
                    )}
                </div>
                 {isAdmin && <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full font-bold">Admin View</span>}
            </div>

            <div className="p-4 space-y-4">
                {loading ? <p className="text-center text-gray-500">Loading...</p> : (
                    teamData.length > 0 ? (
                        teamData.map((member) => (
                            <div 
                                key={member.userId._id} 
                                onClick={() => handleMemberClick(member)}
                                className={`bg-white p-4 rounded-xl shadow-sm flex justify-between items-center transition-colors ${isAdmin ? 'cursor-pointer hover:bg-gray-50 active:bg-gray-100' : ''}`}
                            >
                                <div className="flex items-center space-x-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                        <img src={`https://ui-avatars.com/api/?name=${member.userId.name}&background=random`} alt={member.userId.name} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-gray-800">{member.userId.name}</h4>
                                        <p className="text-xs text-gray-500">{member.userId.designation || 'Employee'} • {member.userId.employeeId}</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    {member.totalHours > 0 && <p className="text-[10px] text-gray-500 font-bold mb-1">Total: {member.totalHours.toFixed(1)} hrs</p>}
                                    {member.status === 'Present' && !member.checkOut?.time ? (
                                        <div className="text-right">
                                            <span className={`px-2 py-1 rounded text-xs font-bold ${member.checkIn?.status === 'Pending' ? 'bg-yellow-100 text-yellow-700' : 'bg-green-100 text-green-700'}`}>
                                                {member.checkIn?.status === 'Pending' ? 'Pending' : 'In'}
                                            </span>
                                            {member.checkIn && <p className="text-xs text-gray-400 mt-1">{new Date(member.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>}
                                        </div>
                                    ) : member.status === 'Present' && member.checkOut?.time ? (
                                         <div className="text-right">
                                            <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-xs font-bold">Out</span>
                                            <p className="text-xs text-gray-400 mt-1">{new Date(member.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</p>
                                        </div>
                                    ) : (
                                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded text-xs font-bold">Absent</span>
                                    )}
                                </div>
                            </div>
                        ))
                    ) : (
                         <div className="text-center py-10">
                            <UserCircle size={48} className="mx-auto text-gray-300 mb-2" />
                            <p className="text-gray-500">No team data available.</p>
                        </div>
                    )
                )}
            </div>
            
            {/* Admin Modal */}
            {selectedMember && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 relative animate-fade-in-up">
                        <button onClick={closeMemberModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
                            <X size={24} />
                        </button>
                        
                        <div className="text-center mb-6">
                            <div className="w-16 h-16 rounded-full bg-gray-200 overflow-hidden mx-auto mb-3 border-4 border-white shadow-sm">
                                <img src={`https://ui-avatars.com/api/?name=${selectedMember.userId.name}&background=random`} alt={selectedMember.userId.name} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-800">{selectedMember.userId.name}</h3>
                            <p className="text-sm text-gray-500">{selectedMember.userId.role}</p>
                        </div>

                         {/* Tabs */}
                        <div className="flex justify-center space-x-2 mb-4 bg-gray-100 p-1 rounded-lg">
                            {['actions', 'details', 'history'].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`flex-1 py-1.5 px-3 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                                        activeTab === tab 
                                        ? 'bg-white text-gray-800 shadow-sm' 
                                        : 'text-gray-500 hover:bg-gray-200'
                                    }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>

                        {activeTab === 'actions' && (
                            <div className="space-y-4 animate-fade-in">
                                <div className="mb-4 bg-gray-50 p-4 rounded-xl">
                                    <h4 className="text-xs uppercase font-bold text-gray-400 mb-2 tracking-wider">Current Status</h4>
                                    <div className="flex justify-between items-center">
                                        <span className="font-semibold text-gray-700">
                                            {selectedMember.status === 'Present' && !selectedMember.checkOut?.time ? 'Checked In' : 
                                            selectedMember.status === 'Present' ? 'Checked Out (Present)' : 'Absent'}
                                        </span>
                                        {selectedMember.checkIn && (
                                            <span className="text-xs bg-white px-2 py-1 rounded border shadow-sm">
                                                Last: {new Date(selectedMember.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Manual Time Override</label>
                                    <div className="relative">
                                        <Clock size={16} className="absolute left-3 top-3 text-gray-400" />
                                        <input 
                                            type="datetime-local" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 pl-10 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            value={manualTime}
                                            onChange={(e) => setManualTime(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Reason / Note</label>
                                    <input 
                                        type="text" 
                                        placeholder="Correction reason..."
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg py-2 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        value={reason}
                                        onChange={(e) => setReason(e.target.value)}
                                    />
                                </div>

                                {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                                <div className="grid grid-cols-2 gap-3 mt-4">
                                    <button 
                                        onClick={() => handleAdminAction('checkIn')}
                                        disabled={actionLoading || (selectedMember.status === 'Present' && !selectedMember.checkOut?.time)}
                                        className={`flex justify-center items-center py-3 rounded-xl font-bold text-sm transition-colors ${
                                            selectedMember.status === 'Present' && !selectedMember.checkOut?.time 
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-green-100 text-green-700 hover:bg-green-200'
                                        }`}
                                    >
                                        {actionLoading ? '...' : 'Mark Check In'}
                                    </button>

                                    <button 
                                        onClick={() => handleAdminAction('checkOut')}
                                        disabled={actionLoading || (!selectedMember.checkIn || (selectedMember.status === 'Present' && !!selectedMember.checkOut?.time))}
                                        className={`flex justify-center items-center py-3 rounded-xl font-bold text-sm transition-colors ${
                                            (!selectedMember.checkIn || (selectedMember.status === 'Present' && !!selectedMember.checkOut?.time))
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                            : 'bg-red-100 text-red-700 hover:bg-red-200'
                                        }`}
                                    >
                                        {actionLoading ? '...' : 'Mark Check Out'}
                                    </button>
                                     {selectedMember.checkIn?.status === 'Pending' && (
                                        <button 
                                            onClick={handleApprove}
                                            disabled={actionLoading}
                                            className="col-span-2 bg-yellow-100 text-yellow-700 font-bold py-3 rounded-xl hover:bg-yellow-200 transition-colors mt-2"
                                        >
                                            {actionLoading ? 'Approving...' : 'Approve Pending Check-In'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'details' && (
                             <div className="space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Name</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                                        value={editForm.name}
                                        onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Designation</label>
                                    <input 
                                        type="text" 
                                        className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                                        value={editForm.designation}
                                        onChange={(e) => setEditForm({...editForm, designation: e.target.value})}
                                    />
                                </div>
                                 <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Empl. ID</label>
                                        <input 
                                            type="text" 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                                            value={editForm.employeeId}
                                            onChange={(e) => setEditForm({...editForm, employeeId: e.target.value})}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-700 mb-1 uppercase">Role</label>
                                        <select 
                                            className="w-full bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                                            value={editForm.role}
                                            onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                                        >
                                            <option value="Employee">Employee</option>
                                            <option value="Admin">Admin</option>
                                            <option value="SuperAdmin">SuperAdmin</option>
                                            <option value="TeamLead">TeamLead</option>
                                        </select>
                                    </div>
                                 </div>
                                 
                                 {error && <p className="text-red-500 text-xs text-center">{error}</p>}

                                 <button 
                                    onClick={handleUpdateUser}
                                    disabled={actionLoading}
                                    className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-md hover:bg-blue-700 transition-colors uppercase tracking-wider mt-4"
                                >
                                    {actionLoading ? 'Updating...' : 'Save Changes'}
                                </button>

                                <div className="mt-6 pt-4 border-t border-gray-100">
                                    <h5 className="text-xs font-bold text-red-500 uppercase mb-2 flex items-center"><Lock size={12} className="mr-1"/> Reset Password</h5>
                                    <div className="flex space-x-2">
                                        <input 
                                            type="text" 
                                            placeholder="New Password"
                                            className="flex-1 bg-gray-50 border border-gray-200 rounded-lg p-2 text-sm"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                        />
                                        <button 
                                            onClick={handleResetPassword}
                                            className="bg-red-50 text-red-600 px-4 rounded-lg text-xs font-bold hover:bg-red-100"
                                            disabled={!newPassword}
                                        >
                                            Reset
                                        </button>
                                    </div>
                                </div>
                             </div>
                        )}

                        {activeTab === 'history' && (
                             <div className="space-y-4 animate-fade-in max-h-[300px] overflow-y-auto pr-1">
                                {historyLoading ? (
                                    <p className="text-center text-gray-400 text-sm">Loading history...</p>
                                ) : (
                                    memberHistory.length > 0 ? (
                                        memberHistory.map((h, i) => (
                                            <div key={i} className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                                <div className="flex justify-between items-center mb-1">
                                                    <span className="text-sm font-bold text-gray-700">{new Date(h.date).toLocaleDateString()}</span>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${h.status === 'Present' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{h.status}</span>
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    {h.sessions && h.sessions.map((s, idx) => (
                                                        <div key={idx} className="mb-1 border-b border-gray-100 pb-1 last:border-0 last:pb-0">
                                                            <div className="flex justify-between">
                                                                <span>
                                                                    {new Date(s.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                                                    {s.checkOut ? new Date(s.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                                                </span>
                                                                <span className="text-gray-400 italic truncate max-w-[80px]">{s.reason}</span>
                                                            </div>
                                                            {s.checkIn?.location && (
                                                                <div className="flex items-center text-[9px] text-gray-400 mt-0.5">
                                                                    <MapPin size={8} className="mr-1" />
                                                                    <span className="truncate max-w-[150px]">
                                                                        {s.checkIn.location.address || `${s.checkIn.location.lat.toFixed(4)}, ${s.checkIn.location.lng.toFixed(4)}`}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                    {(!h.sessions || h.sessions.length === 0) && h.checkIn && (
                                                         <span>
                                                            {new Date(h.checkIn.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} - 
                                                            {h.checkOut ? new Date(h.checkOut.time).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) : '...'}
                                                         </span>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-center text-gray-400 text-sm">No recent history.</p>
                                    )
                                )}
                             </div>
                        )}
                    </div>
                </div>
            )}
            
            <BottomNav />
        </div>
    );
};

export default Team;
