const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const authorize = require('../middleware/authorize');

router.post('/team-size', auth, authorize(['admin']), adminController.setMaxTeamSize);
router.get('/team-size', auth, authorize(['admin']), adminController.getMaxTeamSize);

router.post('/guide-selection-dates', auth, authorize(['admin']), adminController.setGuideSelectionDates);
router.get('/guide-selection-dates', auth, authorize(['admin']), adminController.getGuideSelectionDates);

// New routes for global review period
router.post('/review-period-dates', auth, authorize(['admin']), adminController.setReviewPeriodDates);
router.get('/review-period-dates', auth, authorize(['admin']), adminController.getReviewPeriodDates);

router.get('/unassigned-teams', auth, authorize(['admin']), adminController.getUnassignedTeams);
router.get('/guides-with-team-counts', auth, authorize(['admin']), adminController.getGuidesWithTeamCounts);

router.get('/eligible-guides-for-team/:teamId', auth, authorize(['admin']), adminController.getEligibleGuidesForTeam);
router.post('/assign-guide', auth, authorize(['admin']), adminController.assignGuideToTeam);

router.post('/assign-all-unassigned-guides', auth, authorize(['admin']), adminController.assignAllUnassignedGuides);

router.post('/remove-guide', auth, authorize(['admin']), adminController.removeGuideFromTeam);

// New route for fetching attendance records
router.get('/attendance', auth, authorize(['admin']), adminController.getAttendanceRecords);

// New routes for Admin to manage review schedules
router.get('/review-schedules', auth, authorize(['admin']), adminController.getReviewSchedules);
router.post('/review-schedules', auth, authorize(['admin']), adminController.createReviewSchedule);
router.get('/panels-with-members', auth, authorize(['admin']), adminController.getAllPanels);
router.get('/teams', auth, authorize(['admin']), adminController.getAllTeams);

// New route for fetching all user availabilities (guide and panel)
router.get('/availabilities', auth, authorize(['admin']), adminController.getAllAvailabilities);

// New route for schedule generation
router.post('/generate-schedules', auth, authorize(['admin']), adminController.generateSchedules);

// New route for generating a single slot for a team
router.post('/generate-slot-for-team', auth, authorize(['admin']), adminController.generateSlotForTeam);

// New route to clear all schedules
router.delete('/clear-schedules', auth, authorize(['admin']), adminController.clearSchedules);

// New route to send schedule notification
router.post('/send-schedule-notification', auth, authorize(['admin']), adminController.sendScheduleNotification);

// New route for daily attendance records
router.get('/daily-attendance-records', auth, authorize(['admin']), adminController.getDailyAttendanceRecords);

// New route for assigned teams summary
router.get('/assigned-teams-summary', auth, authorize(['admin']), adminController.getAssignedTeamsSummary);

module.exports = router; 