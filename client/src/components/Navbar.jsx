import { useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AuthContext from '../context/AuthContext';
import { LogOut } from 'lucide-react';

const Navbar = () => {
    const { user, logout } = useContext(AuthContext);
    const navigate = useNavigate();

    const handleLogout = async () => {
        await logout();
        navigate('/login');
    }

    return (
        <nav className="bg-blue-600 p-4 text-white shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">Attendance App</Link>
                <div>
                    {user ? (
                        <div className="flex items-center space-x-4">
                            <span>Welcome, {user.name}</span>
                            {(user.role === 'Admin' || user.role === 'SuperAdmin') && (
                                <Link to="/admin" className="hover:underline">Admin</Link>
                            )}
                            {(user.role === 'TeamLead' || user.role === 'Admin' || user.role === 'SuperAdmin') && (
                                <Link to="/shifts" className="hover:underline">Shifts</Link>
                            )}
                            <button onClick={handleLogout} className="flex items-center bg-red-500 px-3 py-1 rounded hover:bg-red-600 transition">
                                <LogOut className="w-4 h-4 mr-1" /> Logout
                            </button>
                        </div>
                    ) : (
                        <div className="space-x-4">
                            <Link to="/login" className="hover:underline">Login</Link>
                            <Link to="/register" className="hover:underline">Register</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default Navbar;
