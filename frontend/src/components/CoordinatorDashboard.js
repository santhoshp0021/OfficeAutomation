import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './Navbar';
import CoordinatorReviewSchedule from './CoordinatorReviewSchedule';
import LetterGeneration from './coordinator/LetterGeneration';
import CoordinatorVivaSchedule from './coordinator/CoordinatorVivaSchedule';

const CoordinatorRulesDashboard = () => {
    const [teamFormationOpen, setTeamFormationOpen] = useState(true);
    const [guideSelectionStart, setGuideSelectionStart] = useState(null);
    const [guideSelectionEnd, setGuideSelectionEnd] = useState(null);
    const [loadingRules, setLoadingRules] = useState(true);
    const [rulesError, setRulesError] = useState('');

    useEffect(() => {
        const fetchRules = async () => {
            try {
                const token = localStorage.getItem('token');
                const configRes = await fetch('http://localhost:5000/api/teams/config/public');
                const configData = await configRes.json();
                setTeamFormationOpen(configData.teamFormationOpen);
                if (token) {
                    const guideDatesRes = await fetch('http://localhost:5000/api/guide/selection-dates', {
                        headers: { Authorization: `Bearer ${token}` }
                    });
                    if (guideDatesRes.ok) {
                        const guideDates = await guideDatesRes.json();
                        setGuideSelectionStart(guideDates.startDate);
                        setGuideSelectionEnd(guideDates.endDate);
                    }
                }
            } catch (err) {
                setRulesError('Could not load rules info.');
            } finally {
                setLoadingRules(false);
            }
        };
        fetchRules();
    }, []);

    return (
        <div className="bg-white p-6 rounded-lg shadow mb-6">
            <h2 className="text-xl font-semibold mb-4">Coordinator Dashboard Rules & Info</h2>
            {loadingRules ? (
                <div className="mb-4 text-blue-700">Loading rules...</div>
            ) : rulesError ? (
                <div className="mb-4 text-red-700">{rulesError}</div>
            ) : (
                <>
                    <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
                        <li>You can view all teams, guides, and panels.</li>
                        <li>You can generate letters and manage schedules.</li>
                        <li>You cannot change team compositions or guide assignments.</li>
                        <li>You are responsible for scheduling reviews and vivas.</li>
                    </ul>
                    <div className="p-4 bg-blue-50 rounded-md space-y-2">
                        <div className="text-blue-700">
                            <strong>Team Formation:</strong> {teamFormationOpen ? 'Open' : 'Closed'}
                        </div>
                        <div className="text-blue-700">
                            <strong>Guide Selection:</strong> {guideSelectionStart ? (
                                <>
                                    Starts on <span className="font-semibold">{new Date(guideSelectionStart).toLocaleString()}</span>
                                    {guideSelectionEnd && (
                                        <> &ndash; Ends on <span className="font-semibold">{new Date(guideSelectionEnd).toLocaleString()}</span></>
                                    )}
                                </>
                            ) : 'Dates not set'}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

const CoordinatorDashboard = () => {
    const user = JSON.parse(localStorage.getItem('user'));
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        if (location.pathname === '/coordinator-dashboard') {
            navigate('/coordinator-dashboard/dashboard', { replace: true });
        }
    }, [location.pathname, navigate]);

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/';
    };

    return (
        <div>
            <Navbar user={{ ...user, role: 'coordinator' }} onLogout={handleLogout} />
            <div className="p-4">
                <Routes>
                    <Route path="dashboard" element={<CoordinatorRulesDashboard />} />
                    <Route path="review-schedule" element={<CoordinatorReviewSchedule />} />
                    <Route path="viva-schedule" element={<CoordinatorVivaSchedule />} />
                    <Route path="letters" element={<LetterGeneration />} />
                    <Route path="*" element={<Navigate to="dashboard" replace />} />
                </Routes>
            </div>
        </div>
    );
};

export default CoordinatorDashboard; 