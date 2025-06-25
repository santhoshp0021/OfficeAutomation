import React from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar';
import CoordinatorReviewSchedule from './CoordinatorReviewSchedule';
import LetterGeneration from './coordinator/LetterGeneration';
import CoordinatorVivaSchedule from './coordinator/CoordinatorVivaSchedule';

const CoordinatorDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const location = useLocation();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    const renderContent = () => {
        if (location.pathname === '/coordinator-dashboard/review-schedule') {
            return <CoordinatorReviewSchedule />;
        } else if (location.pathname === '/coordinator-dashboard/viva-schedule') {
            return <CoordinatorVivaSchedule />;
        } else if (location.pathname === '/coordinator-dashboard/letters') {
            return <LetterGeneration />;
        }
        return <div>Welcome, Coordinator!</div>;
    };

    return (
        <div>
            <Navbar user={{ ...user, role: 'coordinator' }} onLogout={handleLogout} />
            <div className="p-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default CoordinatorDashboard; 