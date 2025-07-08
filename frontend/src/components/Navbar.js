import React from 'react';
import { useNavigate } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
    const navigate = useNavigate();

    const handleLogout = () => {
        onLogout();
        navigate('/');
    };

    const getNavItems = () => {
        console.log('Navbar user object:', user);
        switch (user.role) {
            case 'student':
                return [
                    { label: 'Dashboard', path: '/student-dashboard' },
                    { label: 'Team Formation', path: '/student-dashboard/team' },
                    { label: 'My Team', path: '/student-dashboard/my-team' },
                    { label: 'Guide Requests', path: '/student-dashboard/guide-requests' },
                    { label: 'My Panel', path: '/student-dashboard/my-panel' },
                    { label: 'Review Schedules', path: '/student-dashboard/review-schedules' },
                    { label: 'Final Report', path: '/student-dashboard/final-report' }
                ];
            case 'guide':
                return [
                    { label: 'Dashboard', path: '/guide-dashboard' },
                    { label: 'Team Requests', path: '/guide-dashboard/requests' },
                    { label: 'My Teams', path: '/guide-dashboard/my-teams' },
                    { label: 'Review Schedules', path: '/guide-dashboard/review-schedules' },
                    { label: 'Upload Attendance', path: '/guide-dashboard/upload-attendance' },
                    { label: 'Mark Teams', path: '/guide-dashboard/mark-teams' },
                    { label: 'Final Reports', path: '/guide-dashboard/final-reports' }
                ];
            case 'panel':
                const panelNavItems = [
                    { label: 'Dashboard', path: '/panel-dashboard' },
                    { label: 'Assigned Teams', path: '/panel-dashboard/assigned-teams' },
                ];
                if (user.memberType === 'internal') {
                    panelNavItems.push({ label: 'Review Schedules', path: '/panel-dashboard/review-schedules' });
                }
                panelNavItems.push({ label: 'Mark Teams', path: '/panel-dashboard/mark-teams' });
                return panelNavItems;
            case 'admin':
                return [
                    { label: 'Dashboard', path: '/admin-dashboard' },
                    { label: 'Max Team Size', path: '/admin-dashboard/settings' },
                    { label: 'Panel Creation', path: '/admin-dashboard/panel-creation' },
                    { label: 'Panel Assignment', path: '/admin-dashboard/panel-assignment' },
                    { label: 'Guide Selection', path: '/admin-dashboard/guide-selection' },
                    { label: 'Guide Assignment Summary', path: '/admin-dashboard/guide-assignment-summary' },
                    { label: 'View Attendance and Marks', path: '/admin-dashboard/view-attendance' },
                    { label: 'Manage Review Schedules', path: '/admin-dashboard/manage-review-schedules' }
                ];
            case 'coordinator':
                return [
                    { label: 'Dashboard', path: '/coordinator-dashboard/dashboard' },
                    { label: 'Review Schedule', path: '/coordinator-dashboard/review-schedule' },
                    { label: 'Viva Schedule', path: '/coordinator-dashboard/viva-schedule' },
                    { label: 'Letters', path: '/coordinator-dashboard/letters' },
                    { label: 'Document Center', path: '/coordinator-dashboard/documents' }
                ];
            default:
                return [];
        }
    };

    return (
        <nav className="bg-indigo-600">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-16">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <span className="text-white font-bold">Project Review</span>
                        </div>
                        <div className="hidden md:block">
                            <div className="ml-10 flex items-baseline space-x-4">
                                {getNavItems().map((item) => (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        className="text-white hover:bg-indigo-500 px-3 py-2 rounded-md text-sm font-medium relative"
                                    >
                                        {item.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center">
                        <span className="text-white mr-4">Welcome, {user.name}</span>
                        <button
                            onClick={handleLogout}
                            className="bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-indigo-800"
                        >
                            Logout
                        </button>
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navbar; 