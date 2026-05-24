const User = require('./models/User');
const Weektable = require('./models/Weektable');
const Timetable = require('./models/Timetable');
const Period = require('./models/Period');
const HolidayDay = require('./models/HolidayDay');
const Enrollment = require('./models/Enrollment');

function localDateStr(d) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

// Returns the HolidayDay doc if the date is a holiday, null otherwise
async function checkHoliday(dateStr) {
  return HolidayDay.findOne({ date: dateStr });
}

// Get Monday of the week containing dateInput (local time)
function getWeekStart(dateInput) {
  const d = new Date(dateInput || Date.now());
  const day = d.getDay(); // 0=Sun, 1=Mon ... 6=Sat
  const diff = day === 0 ? -6 : 1 - day;
  const monday = new Date(d);
  monday.setDate(d.getDate() + diff);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

function getCurrentWeekStart() {
  return getWeekStart(new Date());
}

// Get Monday offset by `offset` weeks from current week
function getWeekStartWithOffset(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset * 7);
  return getWeekStart(d);
}

function getNextWeekStart() {
  return getWeekStartWithOffset(1);
}

const PERIOD_TIMES = [
  { startTime: '08:30', endTime: '09:20' },
  { startTime: '09:25', endTime: '10:15' },
  { startTime: '10:30', endTime: '11:20' },
  { startTime: '11:25', endTime: '12:15' },
  { startTime: '13:10', endTime: '14:00' },
  { startTime: '14:05', endTime: '14:55' },
  { startTime: '15:00', endTime: '15:50' },
  { startTime: '15:55', endTime: '16:45' },
];

function blankPeriods() {
  const periods = [];
  for (let day = 1; day <= 5; day++) {
    for (let periodNo = 1; periodNo <= 8; periodNo++) {
      periods.push({
        periodNo, day, periodId: `${periodNo}-${day}`, free: true,
        roomNo: '', courseCode: '', staffName: '', lab: '', projector: '',
        startTime: PERIOD_TIMES[periodNo - 1].startTime,
        endTime: PERIOD_TIMES[periodNo - 1].endTime,
      });
    }
  }
  return periods;
}

async function generatePeriodsForUser(userId) {
  // Faculty: use their own timetable directly
  const timetable = await Timetable.findOne({ userId });
  if (timetable && timetable.periods.length > 0) {
    const periodDocs = await Period.find({ _id: { $in: timetable.periods } });
    return periodDocs.map(p => ({
      periodNo: p.periodNo,
      day: p.day,
      periodId: p.periodId,
      free: p.free !== false,
      roomNo: p.roomNo || '',
      courseCode: p.courseCode || '',
      staffName: p.staffName || '',
      lab: p.lab || '',
      projector: '',
      startTime: p.startTime || PERIOD_TIMES[p.periodNo - 1]?.startTime || '',
      endTime: p.endTime || PERIOD_TIMES[p.periodNo - 1]?.endTime || '',
    }));
  }

  // Students / reps: derive periods from every faculty enrollment they appear in
  const enrollments = await Enrollment.find({
    $or: [{ 'courses.students': userId }, { 'courses.studentReps': userId }],
  });

  if (enrollments.length > 0) {
    const periodsMap = {}; // periodId -> period object

    for (const enrollment of enrollments) {
      const facultyTimetable = await Timetable.findOne({ userId: enrollment.facultyId });
      if (!facultyTimetable || !facultyTimetable.periods.length) continue;

      const facultyPeriods = await Period.find({ _id: { $in: facultyTimetable.periods } });

      // Which course codes is this user enrolled in under this faculty?
      const userCourseCodes = new Set(
        enrollment.courses
          .filter(c => c.students.includes(userId) || c.studentReps.includes(userId))
          .map(c => c.courseCode)
      );

      for (const p of facultyPeriods) {
        if (!p.courseCode || !userCourseCodes.has(p.courseCode)) continue;
        const key = `${p.periodNo}-${p.day}`;
        if (!periodsMap[key]) {
          periodsMap[key] = {
            periodNo: p.periodNo,
            day: p.day,
            periodId: key,
            free: true,
            roomNo: '',
            courseCode: p.courseCode,
            staffName: p.staffName || enrollment.staffName || enrollment.facultyId,
            lab: p.lab || '',
            projector: '',
            startTime: p.startTime || PERIOD_TIMES[p.periodNo - 1]?.startTime || '',
            endTime: p.endTime || PERIOD_TIMES[p.periodNo - 1]?.endTime || '',
          };
        }
      }
    }

    if (Object.keys(periodsMap).length > 0) {
      // Fill the full 5×8 grid; slots not in any enrolled course stay blank-free
      const periods = [];
      for (let day = 1; day <= 5; day++) {
        for (let periodNo = 1; periodNo <= 8; periodNo++) {
          const key = `${periodNo}-${day}`;
          periods.push(periodsMap[key] || {
            periodNo, day, periodId: key, free: true,
            roomNo: '', courseCode: '', staffName: '', lab: '', projector: '',
            startTime: PERIOD_TIMES[periodNo - 1].startTime,
            endTime: PERIOD_TIMES[periodNo - 1].endTime,
          });
        }
      }
      return periods;
    }
  }

  return blankPeriods();
}

// Called on server startup — only creates missing weektables, never overwrites existing bookings
async function ensureWeektablesForAllUsers() {
  const users = await User.find({});
  for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
    const weekStart = getWeekStartWithOffset(weekOffset);
    for (const user of users) {
      const existing = await Weektable.findOne({ userId: user.userId, weekStart });
      if (!existing) {
        const periods = await generatePeriodsForUser(user.userId);
        await Weektable.create({ userId: user.userId, periods, weekStart });
      }
    }
  }
}

// Called after a timetable upload — updates future free slots while preserving bookings
async function regenerateWeektablesForUser(userId) {
  const newPeriods = await generatePeriodsForUser(userId);
  for (let weekOffset = 0; weekOffset < 5; weekOffset++) {
    const weekStart = getWeekStartWithOffset(weekOffset);
    const existing = await Weektable.findOne({ userId, weekStart });
    if (!existing) {
      await Weektable.create({ userId, periods: newPeriods, weekStart });
    } else {
      // Merge: preserve booked periods, update free ones with new timetable
      existing.periods = newPeriods.map((newP, idx) => {
        const old = existing.periods[idx];
        if (old && !old.free) return old; // keep booking
        return newP;
      });
      await existing.save();
    }
  }
}

/**
 * Propagates a period booking/free change to all members of the same course group.
 * Primary source: Enrollment model (facultyId + course.studentReps + course.students).
 * Fallback:       any weektable that already has courseCode at the same periodId.
 * applyFn(period) mutates the matched period object before saving.
 */
async function propagatePeriodUpdate(weekStart, periodId, courseCode, bookerUserId, applyFn) {
  if (!courseCode) return;

  const targetUserIds = new Set();

  // Primary: all members defined in enrollment
  const enrollments = await Enrollment.find({ 'courses.courseCode': courseCode });
  for (const enrollment of enrollments) {
    const course = enrollment.courses.find(c => c.courseCode === courseCode);
    if (!course) continue;
    targetUserIds.add(enrollment.facultyId);
    course.studentReps.forEach(id => targetUserIds.add(id));
    course.students.forEach(id => targetUserIds.add(id));
  }

  // Fallback: weektables that already carry this courseCode at this periodId
  const weekWeektables = await Weektable.find({ weekStart, userId: { $ne: bookerUserId } });
  for (const wt of weekWeektables) {
    if (wt.periods.some(p => p.periodId === periodId && p.courseCode === courseCode)) {
      targetUserIds.add(wt.userId);
    }
  }

  targetUserIds.delete(bookerUserId);

  const saves = [];
  for (const userId of targetUserIds) {
    let wt = weekWeektables.find(w => w.userId === userId);
    if (!wt) wt = await Weektable.findOne({ userId, weekStart });
    if (!wt) continue;

    const p = wt.periods.find(p => p.periodId === periodId);
    if (!p) continue;

    applyFn(p);
    if (!p.courseCode) p.courseCode = courseCode;
    saves.push(wt.save());
  }
  await Promise.all(saves);
}

// Admin-triggered: generate weektables for all users from current week up to (and including) the week of tillDate
async function ensureWeektablesUntil(tillDate) {
  const users = await User.find({});
  const target = getWeekStart(tillDate);
  let created = 0, skipped = 0;

  const cur = getCurrentWeekStart();
  while (cur <= target) {
    const weekStart = new Date(cur);
    for (const user of users) {
      const existing = await Weektable.findOne({ userId: user.userId, weekStart });
      if (!existing) {
        const periods = await generatePeriodsForUser(user.userId);
        await Weektable.create({ userId: user.userId, periods, weekStart });
        created++;
      } else {
        skipped++;
      }
    }
    cur.setDate(cur.getDate() + 7);
  }
  return { created, skipped, users: users.length };
}

module.exports = {
  getWeekStart,
  getCurrentWeekStart,
  getWeekStartWithOffset,
  getNextWeekStart,
  ensureWeektablesForAllUsers,
  ensureWeektablesUntil,
  regenerateWeektablesForUser,
  propagatePeriodUpdate,
  PERIOD_TIMES,
  localDateStr,
  checkHoliday,
};
