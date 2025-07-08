import React, { useState, useEffect } from 'react';
import { courseService } from '../services/courseService';
import { timetableService } from '../services/timetableService';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import axios from 'axios';
import { facultyService } from '../services/facultyService';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
const TIME_SLOTS = ['08:30-09:20', '09:25-10:15', '10:30-11:20', '11:25-12:15', '01:10-02:00', '02:05-02:55', '03:00-03:50', '03:55-04:45'];
const UG_BATCHES = ['Batch N', 'Batch P', 'Batch Q'];
const PG_BATCHES = ['PG Batch'];

// Helper to normalize batch names for matching with faculty assignment data
const normalizeBatch = (batch) => {
  if (batch === 'Batch N') return 'N';
  if (batch === 'Batch P') return 'P';
  if (batch === 'Batch Q') return 'Q';
  if (batch === 'PG Batch') return 'PG';
  return batch;
};

const TimetableBuilder = () => {
  const [courses, setCourses] = useState([]);
  const [studentType, setStudentType] = useState(''); // 'UG' or 'PG'
  const [selectedSemester, setSelectedSemester] = useState('');
  const [timetables, setTimetables] = useState({});
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [constraints, setConstraints] = useState({
    firstHourSessions: {},
    consecutiveClasses: {},
    freeDays: {},
    labDays: {}
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savedTimetables, setSavedTimetables] = useState([]);
  const [currentTimetableName, setCurrentTimetableName] = useState('');
  const [showSaveModal, setShowSaveModal] = useState(false);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [scheduleSuccess, setScheduleSuccess] = useState(false);
  const [showTypeSelection, setShowTypeSelection] = useState(true);
  const [displayBatch, setDisplayBatch] = useState('');
  const [previewTimetable, setPreviewTimetable] = useState(null);
  const [facultyData, setFacultyData] = useState([]);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [diagnosticRows, setDiagnosticRows] = useState([]);
  const [roomAllocations, setRoomAllocations] = useState([]);

  useEffect(() => {
    fetchCourses();
    fetchSavedTimetables();
    // Fetch faculty course assignments from new collection
    facultyService.getFacultyCourseAssignments().then(res => {
      console.log('Fetched faculty assignments:', res.length, 'items');
      setFacultyData(res);
      
      // Show warning if no faculty assignments found
      if (res.length === 0) {
        toast.warning('No faculty assignments found. Click "Populate Assignments" to create them from existing faculty data.');
      }
    }).catch(error => {
      console.error('Error fetching faculty assignments:', error);
      // Fallback to old method if new endpoint fails
      facultyService.getAllFaculty().then(res => {
        console.log('Fallback: Fetched faculty data from old endpoint');
        setFacultyData(res.faculties || res);
      }).catch(fallbackError => {
        console.error('Fallback also failed:', fallbackError);
        setFacultyData([]);
      });
    });
    // Fetch room allocations
    timetableService.getRoomAllocations().then(setRoomAllocations).catch(() => setRoomAllocations([]));
  }, []);

  useEffect(() => {
    if (studentType && selectedSemester) {
      initializeTimetable();
    }
  }, [studentType, selectedSemester]);

  useEffect(() => {
    // Show toast only if timetable is non-empty and scheduleSuccess is true
    if (scheduleSuccess && timetables[selectedSemester] && Object.keys(timetables[selectedSemester]).length > 0) {
      toast.success('Time Table auto scheduled successfully');
      setScheduleSuccess(false);
    }
  }, [scheduleSuccess, timetables, selectedSemester]);

  const fetchSavedTimetables = async () => {
    try {
      const response = await timetableService.getAllTimetables();
      setSavedTimetables(response);
    } catch (error) {
      console.error('Error fetching timetables:', error);
    }
  };

  const fetchCourses = async () => {
    try {
      const response = await courseService.getAllCourses();
      setCourses(response);
    } catch (error) {
      setError('Failed to fetch courses');
      console.error('Error fetching courses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStudentTypeSelection = (type) => {
    setStudentType(type);
    setSelectedSemester('');
    setShowTypeSelection(false);
  };

  const getBatches = () => {
    return studentType === 'UG' ? UG_BATCHES : PG_BATCHES;
  };

  const getSemesterOptions = () => {
    if (studentType === 'UG') {
      return [1, 2, 3, 4, 5, 6, 7, 8];
    } else if (studentType === 'PG') {
      return [1, 2, 3, 4];
    }
    return [];
  };

  const initializeTimetable = () => {
    const batches = getBatches();
    const initialTimetable = {};
    DAYS.forEach(day => {
      initialTimetable[day] = {};
      TIME_SLOTS.forEach(slot => {
        initialTimetable[day][slot] = {};
        batches.forEach(batch => {
          initialTimetable[day][slot][batch] = {};
        });
      });
    });
    setTimetables(prev => ({
      ...prev,
      [selectedSemester]: initialTimetable
    }));
  };

  const handleSemesterChange = (semester) => {
    setSelectedSemester(semester);
    if (!timetables[semester]) {
      initializeTimetable();
    }
  };

  const checkConstraints = (day, slot, course, batch) => {
    // Determine the required roles for this course
    const isLabIntegratedTheory = course.category === 'Lab Integrated Theory';
    const isLabCourse = course.category === 'Lab';
    const isTheoryCourse = course.category === 'Theory';
    
    let requiredRoles = [];
    if (isLabIntegratedTheory) {
      // Only 'Lab Incharge' for lab hours, 'Theory Teacher' for theory hours
      requiredRoles = ['Lab Incharge'];
    } else if (isLabCourse) {
      requiredRoles = ['Lab Incharge', 'Lab Assistant'];
    } else {
      requiredRoles = ['Theory Teacher'];
    }
    
    // Find faculty for the first available role
    let faculty = 'Unassigned';
    let role = 'Theory Teacher';
    
    for (const requiredRole of requiredRoles) {
      const result = findFacultyForCourse(course, batch, selectedSemester, requiredRole);
      if (result.faculty !== 'Unassigned') {
        faculty = result.faculty;
        role = requiredRole;
        console.log(`Assigned faculty: ${faculty} for role: ${role} (${result.matchType})`);
        break;
      }
    }

    const isFirstHour = slot === TIME_SLOTS[0];
    const isLabDay = constraints.labDays[day];
    const hasTheoryOnLabDay = Object.values(timetables[selectedSemester][day]).some(slotSchedule => 
      Object.values(slotSchedule).some(scheduledCourse => 
        scheduledCourse && scheduledCourse.faculty === faculty && !scheduledCourse.isLab
      )
    );

    // Check first hour session constraint
    if (isFirstHour && !constraints.firstHourSessions[faculty]) {
      return { valid: false, message: 'Faculty must have at least one first-hour session per week' };
    }

    // Check consecutive classes constraint
    const slotIndex = TIME_SLOTS.indexOf(slot);
    if (slotIndex > 0) {
      const prevSlot = TIME_SLOTS[slotIndex - 1];
      const prevCourse = timetables[selectedSemester][day][prevSlot][batch];
      if (prevCourse && prevCourse.faculty === faculty) {
        return { valid: false, message: 'No consecutive classes allowed for the same faculty' };
      }
    }

    // Check free day constraint
    const facultyDays = DAYS.filter(d => 
      Object.values(timetables[selectedSemester][d]).some(s => 
        Object.values(s).some(c => c && c.faculty === faculty)
      )
    );
    if (facultyDays.length === 4 && !facultyDays.includes(day)) {
      return { valid: false, message: 'Faculty must have one free day per week' };
    }

    // Check lab day theory session constraint
    if (isLabDay && !course.isLab && hasTheoryOnLabDay) {
      return { valid: false, message: 'Only one theory session allowed on lab days' };
    }

    return { valid: true };
  };

  const handleSlotClick = (day, slot, batch) => {
    setSelectedSlot({ day, slot, batch });
  };

  const handleCourseSelect = (course) => {
    if (!selectedSlot) return;

    const { day, slot, batch } = selectedSlot;
    
    // Determine the required roles for this course
    const isLabIntegratedTheory = course.category === 'Lab Integrated Theory';
    const isLabCourse = course.category === 'Lab';
    const isTheoryCourse = course.category === 'Theory';
    
    let requiredRoles = [];
    if (isLabIntegratedTheory) {
      // Only 'Lab Incharge' for lab hours, 'Theory Teacher' for theory hours
      // Determine if this is a lab or theory slot by context (if possible)
      // For manual assignment, always use 'Lab Incharge' for lab slots, 'Theory Teacher' for theory slots
      // If you want to distinguish, you may need to add a UI toggle or context
      requiredRoles = ['Lab Incharge'];
    } else if (isLabCourse) {
      requiredRoles = ['Lab Incharge', 'Lab Assistant'];
    } else {
      requiredRoles = ['Theory Teacher'];
    }
    
    // Find faculty for the first available role
    let assignedFaculty = 'Unassigned';
    let assignedRole = requiredRoles[0];
    
    for (const role of requiredRoles) {
      const result = findFacultyForCourse(course, batch, selectedSemester, role);
      if (result.faculty !== 'Unassigned') {
        assignedFaculty = result.faculty;
        assignedRole = role;
        console.log(`Manual assignment: ${assignedFaculty} for role: ${assignedRole} (${result.matchType})`);
        break;
      }
    }
    
    // Create course object with assigned faculty
    const courseWithFaculty = {
      ...course,
      faculty: assignedFaculty,
      role: assignedRole,
      isLab: course.category === 'Lab' || course.category === 'Lab Integrated Theory'
    };
    
    const constraintCheck = checkConstraints(day, slot, courseWithFaculty, batch);

    if (constraintCheck.valid) {
      const newTimetable = { ...timetables[selectedSemester] };
      newTimetable[day][slot][batch] = courseWithFaculty;
      setTimetables(prev => ({
        ...prev,
        [selectedSemester]: newTimetable
      }));

      // Update constraints
      if (slot === TIME_SLOTS[0]) {
        setConstraints(prev => ({
          ...prev,
          firstHourSessions: { ...prev.firstHourSessions, [assignedFaculty]: true }
        }));
      }
    } else {
      alert(constraintCheck.message);
    }

    setSelectedCourse(null);
    setSelectedSlot(null);
  };

  const handleClearSlot = (day, slot, batch) => {
    const newTimetable = { ...timetables[selectedSemester] };
    const course = newTimetable[day][slot][batch];
    
    if (course) {
      // Update first hour session constraint if needed
      if (slot === TIME_SLOTS[0]) {
        const hasOtherFirstHour = Object.entries(newTimetable).some(([d, slots]) => {
          if (d === day) return false;
          return Object.values(slots[TIME_SLOTS[0]]).some(c => c && c.faculty === course.faculty);
        });

        if (!hasOtherFirstHour) {
          setConstraints(prev => ({
            ...prev,
            firstHourSessions: { ...prev.firstHourSessions, [course.faculty]: false }
          }));
        }
      }
    }

    newTimetable[day][slot][batch] = null;
    setTimetables(prev => ({
      ...prev,
      [selectedSemester]: newTimetable
    }));
  };

  const handleToggleLabDay = (day) => {
    setConstraints(prev => ({
      ...prev,
      labDays: { ...prev.labDays, [day]: !prev.labDays[day] }
    }));
  };

  // --- STRICT CONSTRAINT AUTO-SCHEDULE FUNCTION ---
  const autoSchedule = async () => {
    try {
      const batches = getBatches();
      const semesterCourses = courses.filter(course => 
        String(course.semester) === String(selectedSemester) && 
        course.type === studentType
      );
      if (semesterCourses.length === 0) {
        toast.error('No courses found for the selected semester and student type');
        return;
      }

      // Helper constants
      const allDays = [...DAYS];
      const allSlots = [...TIME_SLOTS];
      const normBatches = batches.map(normalizeBatch);

      // Faculty schedule map: facultyName -> { day: Set(slots) }
      const facultySchedule = {};
      // For type tracking: day -> slot -> 'theory'|'lab'
      const typeMap = {};
      // Build empty timetable for each batch
      const newTimetable = {};
      normBatches.forEach(batch => {
        allDays.forEach(day => {
          if (!newTimetable[day]) newTimetable[day] = {};
          if (!typeMap[day]) typeMap[day] = {};
          allSlots.forEach(slot => {
            if (!newTimetable[day][slot]) newTimetable[day][slot] = {};
            newTimetable[day][slot][batch] = null;
            typeMap[day][slot] = null;
          });
        });
      });

      // --- Normalization helpers ---
      const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
      const normRole = r => (r || '').replace(/\s+/g, ' ').trim();
      const normBatchKey = b => normalizeBatch((b || '').replace(/\s+/g, ' ').trim());

      // Helper: get faculty for course/batch/semester/role
      const getFaculty = (course, batch, semester, role = null) => {
        // For Lab Integrated Theory, only allow Lab Incharge
        if (course.category === 'Lab Integrated Theory') {
          const match = facultyData.find(fa =>
            (norm(fa.courseCode) === norm(course.code) || norm(fa.courseName) === norm(course.name)) &&
            normBatchKey(fa.batch) === normBatchKey(batch) &&
            String(fa.semester) === String(semester) &&
            normRole(fa.role) === 'Lab Incharge'
          );
          if (match) return match.facultyName;
        }
        // For all other courses, never allow Lab Assistant
        const match = facultyData.find(fa =>
          (norm(fa.courseCode) === norm(course.code) || norm(fa.courseName) === norm(course.name)) &&
          normBatchKey(fa.batch) === normBatchKey(batch) &&
          String(fa.semester) === String(semester) &&
          normRole(fa.role) !== 'Lab Assistant'
        );
        return match ? match.facultyName : null;
      };
      // Helper: is faculty free at day/slot
      const isFacultyAvailable = (faculty, day, slot) => {
        if (!facultySchedule[faculty]) return true;
        return !facultySchedule[faculty][day]?.has(slot);
      };
      // Assign slot to faculty
      const assignFacultySlot = (faculty, day, slot) => {
        if (!facultySchedule[faculty]) facultySchedule[faculty] = {};
        if (!facultySchedule[faculty][day]) facultySchedule[faculty][day] = new Set();
        facultySchedule[faculty][day].add(slot);
      };
      // Count first-hour assignments
      const facultyFirstHourCount = (faculty) => {
        if (!facultySchedule[faculty]) return 0;
        return Object.keys(facultySchedule[faculty]).filter(day => facultySchedule[faculty][day].has(allSlots[0])).length;
      };
      // Count free days
      const facultyFreeDays = (faculty) => {
        if (!facultySchedule[faculty]) return allDays.length;
        return allDays.filter(day => !facultySchedule[faculty][day] || facultySchedule[faculty][day].size === 0).length;
      };
      // Count theory/lab on a day
      const facultyDayTypeCount = (faculty, day, typeMap) => {
        if (!facultySchedule[faculty] || !facultySchedule[faculty][day]) return { theory: 0, lab: 0 };
        let theory = 0, lab = 0;
        for (const slot of facultySchedule[faculty][day]) {
          if (typeMap[day]?.[slot] === 'lab') lab++;
          else if (typeMap[day]?.[slot] === 'theory') theory++;
        }
        return { theory, lab };
      };
      // Helper: log unscheduled
      const unscheduled = [];
      // Try to assign a session
      const tryAssign = (course, batch, type, hours, mustBeConsecutive = false, preferFirstHour = false) => {
        let assigned = 0;
        const faculty = getFaculty(course, batch, selectedSemester, type === 'lab' ? 'Lab Incharge' : 'Theory Teacher');
        if (!faculty) {
          unscheduled.push({ course: course.code, semester: selectedSemester, faculty: 'Unassigned', reason: 'No faculty mapped', batch });
          console.warn(`[UNSCHEDULED] No faculty mapped for ${course.code} (${course.name}), batch ${batch}, semester ${selectedSemester}, type ${type}`);
          return 0;
        }
        let daysOrder = [...allDays];
        if (preferFirstHour) daysOrder = [allDays[0], ...allDays.slice(1)];
        // --- Spread assignments: prefer days with fewer classes for this batch ---
        if (!preferFirstHour) {
          daysOrder = daysOrder.slice().sort((a, b) => {
            const aCount = allSlots.filter(slot => newTimetable[a][slot][batch]).length;
            const bCount = allSlots.filter(slot => newTimetable[b][slot][batch]).length;
            return aCount - bCount;
          });
        }
        for (const day of daysOrder) {
          // 💡 Constraint: Only one lab session per day for each batch (refined)
          if (type === 'lab') {
            // Count how many lab hours for this course are already scheduled for this batch on this day
            const scheduledLabHours = allSlots.filter(slot => {
              const scheduled = newTimetable[day][slot][batch];
              return scheduled && scheduled.isLab && scheduled.code === course.code;
            }).length;
            // If all required lab hours for this course are already scheduled for this batch on this day, skip
            if (scheduledLabHours >= course.credits) continue;
          }
          // Free day constraint: skip if this would remove last free day
          if (facultyFreeDays(faculty) <= 1 && facultySchedule[faculty]?.[day]?.size > 0) continue;
          for (let slotIdx = 0; slotIdx <= allSlots.length - hours; slotIdx++) {
            if (preferFirstHour && slotIdx !== 0) continue;
            if (mustBeConsecutive && slotIdx + hours > allSlots.length) continue;
            // Prevent lab block from spanning lunch break (between slot 3 and 4)
            if (type === 'lab' && mustBeConsecutive) {
              const start = slotIdx;
              const end = slotIdx + hours - 1;
              if (start <= 3 && end >= 4) continue;
            }
            // Check all slots are free for consecutive
            let canAssign = true;
            for (let h = 0; h < hours; h++) {
              const slot = allSlots[slotIdx + h];
              if (!slot) { canAssign = false; break; }
              // Only block if faculty is already teaching at this exact slot for any batch
              let facultyBusy = false;
              for (const b of normBatches) {
                if (newTimetable[day][slot][b] && newTimetable[day][slot][b]?.faculty === faculty) {
                  facultyBusy = true; break;
                }
              }
              if (facultyBusy) {
                canAssign = false;
                console.log(`[SKIP] ${faculty} busy at ${day} ${slot} for another batch`);
                break;
              }
              // Only block if this slot is filled for the current batch
              if (newTimetable[day][slot][batch]) {
                canAssign = false;
                console.log(`[SKIP] Slot ${day} ${slot} already filled for batch ${batch}`);
                break;
              }
            }
            if (!canAssign) continue;
            // Lab-theory constraint: if lab, only one theory allowed that day
            if (type === 'lab') {
              const { theory, lab } = facultyDayTypeCount(faculty, day, typeMap);
              if (lab > 0 || theory > 1) continue;
            }
            // Assign
            for (let h = 0; h < hours; h++) {
              const slot = allSlots[slotIdx + h];
              newTimetable[day][slot][batch] = { ...course, faculty, isLab: type === 'lab' };
              typeMap[day][slot] = type;
              assignFacultySlot(faculty, day, slot);
            }
            assigned += hours;
            if (preferFirstHour) return assigned;
            if (assigned >= hours) return assigned;
          }
        }
        if (assigned < hours) {
          unscheduled.push({ course: course.code, semester: selectedSemester, faculty, reason: `Could not assign all ${type} hours`, batch });
          console.warn(`[UNSCHEDULED] Could not assign all ${type} hours for ${course.code} (${course.name}), batch ${batch}, assigned ${assigned}/${hours}`);
        }
        return assigned;
      };
      // --- MAIN SCHEDULING LOOP ---
      for (const course of semesterCourses) {
        for (const batch of normBatches) {
          // --- STRICT WEEKLY HOUR MAPPING ---
          let theoryHours = 0, labHours = 0, mustBeConsecutive = false, labBlockSize = 2;
          if (course.category === 'Theory') {
            theoryHours = Number(course.credits);
            mustBeConsecutive = false;
          } else if (course.category === 'Lab') {
            labHours = Number(course.credits);
            mustBeConsecutive = true;
            labBlockSize = labHours;
          } else if (course.category === 'Lab Integrated Theory') {
            if (course.credits === 2) {
              labHours = 3; mustBeConsecutive = true; labBlockSize = 3;
            } else if (course.credits === 3) {
              theoryHours = 2; labHours = 2; mustBeConsecutive = false; labBlockSize = 2;
            } else if (course.credits === 4) {
              theoryHours = 3; labHours = 2; mustBeConsecutive = false; labBlockSize = 2;
            } else if (course.credits === 5 || course.credits === 6) {
              theoryHours = 3; labHours = 4; mustBeConsecutive = false; labBlockSize = 4;
            }
          }
          // Assign theory hours (brute-force, no maxAttempts)
          if (theoryHours > 0) {
            let assigned = 0;
            const faculty = getFaculty(course, batch, selectedSemester, 'Theory Teacher');
            for (let h = 0; h < theoryHours; h++) {
              let found = false;
              for (const day of DAYS) {
                // Count already scheduled theory hours for this course/batch on this day
                const theoryCount = TIME_SLOTS.filter(slot => {
                  const scheduled = newTimetable[day][slot][batch];
                  return scheduled && scheduled.code === course.code && !scheduled.isLab;
                }).length;
                if (theoryCount >= 2) continue; // Enforce max 2 theory hours per day for this course/batch
                for (const slot of TIME_SLOTS) {
                  // Check if slot is free for this batch
                  if (newTimetable[day][slot][batch]) {
                    console.log(`[SKIP] Slot ${day} ${slot} already filled for batch ${batch}`);
                    continue;
                  }
                  // Check if faculty is teaching any batch at this slot
                  let facultyBusy = false;
                  for (const b of normBatches) {
                    if (newTimetable[day][slot][b] && newTimetable[day][slot][b]?.faculty === faculty) {
                      facultyBusy = true;
                      break;
                    }
                  }
                  if (facultyBusy) {
                    console.log(`[SKIP] ${faculty} busy at ${day} ${slot} for another batch`);
                    continue;
                  }
                  // Assign
                  newTimetable[day][slot][batch] = { ...course, faculty, isLab: false };
                  typeMap[day][slot] = 'theory';
                  assignFacultySlot(faculty, day, slot);
                  assigned++;
                  found = true;
                  break;
                }
                if (found) break;
              }
              if (!found) {
                unscheduled.push({ course: course.code, semester: selectedSemester, faculty, reason: `Could not assign a theory hour`, batch });
                console.warn(`[UNSCHEDULED] Could not assign a theory hour for ${course.code} (${course.name}), batch ${batch}`);
              }
            }
            if (assigned < theoryHours) {
              unscheduled.push({ course: course.code, semester: selectedSemester, faculty, reason: `Could not assign all theory hours (assigned ${assigned}/${theoryHours})`, batch });
              console.warn(`[UNSCHEDULED] Theory: ${course.code} (${course.name}), batch ${batch}, assigned ${assigned}/${theoryHours}`);
            }
          }
          // Assign lab hours (consecutive blocks)
          if (labHours > 0) {
            let assigned = 0;
            let attempts = 0;
            const maxAttempts = 2 * allDays.length * allSlots.length;
            while (assigned < labHours && attempts < maxAttempts) {
              const before = assigned;
              const block = Math.min(labBlockSize, labHours - assigned);
              assigned += tryAssign(course, batch, 'lab', block, true, false);
              if (assigned === before) attempts++;
              else attempts = 0;
            }
            if (assigned < labHours) {
              unscheduled.push({ course: course.code, semester: selectedSemester, faculty: getFaculty(course, batch, selectedSemester, 'Lab Incharge'), reason: `Could not assign all lab hours (assigned ${assigned}/${labHours})`, batch });
              console.warn(`[UNSCHEDULED] Lab: ${course.code} (${course.name}), batch ${batch}, assigned ${assigned}/${labHours}`);
            }
          }
        }
      }
      // 3. Check free day for each faculty
      for (const faculty of Object.keys(facultySchedule)) {
        if (facultyFreeDays(faculty) < 1) {
          unscheduled.push({ course: '-', semester: selectedSemester, faculty, reason: 'No free day' });
          console.warn(`[UNSCHEDULED] Faculty ${faculty} has no free day`);
        }
      }
      // 4. Ensure no batch has a completely free day (student constraint)
      for (const batch of normBatches) {
        for (const day of allDays) {
          const allEmpty = allSlots.every(slot => !newTimetable[day][slot][batch]);
          if (allEmpty) {
            let filled = false;
            for (const otherDay of allDays) {
              if (otherDay === day) continue;
              for (const slot of allSlots) {
                const course = newTimetable[otherDay][slot][batch];
                if (!course) continue;
                const otherDayClassCount = allSlots.filter(s => newTimetable[otherDay][s][batch]).length;
                if (otherDayClassCount <= 1) continue;
                for (const targetSlot of allSlots) {
                  let facultyConflict = false;
                  for (const b of normBatches) {
                    if (newTimetable[day][targetSlot][b] && newTimetable[day][targetSlot][b]?.faculty === course.faculty) {
                      facultyConflict = true; break;
                    }
                  }
                  if (facultyConflict) continue;
                  if (facultySchedule[course.faculty]?.[day]?.has(targetSlot)) continue;
                  if (course.isLab) {
                    const { theory, lab } = facultyDayTypeCount(course.faculty, day, typeMap);
                    if (lab > 0 || theory > 1) continue;
                  }
                  newTimetable[day][targetSlot][batch] = course;
                  newTimetable[otherDay][slot][batch] = null;
                  assignFacultySlot(course.faculty, day, targetSlot);
                  if (facultySchedule[course.faculty] && facultySchedule[course.faculty][otherDay]) {
                    facultySchedule[course.faculty][otherDay].delete(slot);
                  }
                  filled = true;
                  break;
                }
                if (filled) break;
              }
              if (filled) break;
            }
            if (!filled) {
              for (let i = 0; i < unscheduled.length; i++) {
                const entry = unscheduled[i];
                if (entry.semester === selectedSemester && entry.faculty && entry.course && entry.reason && entry.reason.includes('Could not assign')) {
                  for (const slot of allSlots) {
                    let facultyConflict = false;
                    for (const b of normBatches) {
                      if (newTimetable[day][slot][b] && newTimetable[day][slot][b]?.faculty === entry.faculty) {
                        facultyConflict = true; break;
                      }
                    }
                    if (facultyConflict) continue;
                    if (facultySchedule[entry.faculty]?.[day]?.has(slot)) continue;
                    newTimetable[day][slot][batch] = { name: entry.course, faculty: entry.faculty, code: entry.course, isLab: false, category: 'Theory' };
                    assignFacultySlot(entry.faculty, day, slot);
                    unscheduled.splice(i, 1);
                    filled = true;
                    break;
                  }
                  if (filled) break;
                }
              }
            }
            if (!filled) {
              unscheduled.push({ course: '-', semester: selectedSemester, faculty: '-', reason: `Batch ${batch} has a free day (${day})` });
              console.warn(`[UNSCHEDULED] Batch ${batch} has a free day (${day})`);
            }
          }
        }
      }
      // 4. Show preview and unscheduled summary
      setPreviewTimetable(newTimetable);
      setDisplayBatch(batches[0]);
      setScheduleSuccess(true);
      if (unscheduled.length > 0) {
        toast.warn(`Partial schedule: ${unscheduled.length} unscheduled entries. See console for details.`);
        console.warn('Unscheduled entries:', unscheduled);
      } else {
        toast.success('Preview of auto-scheduled timetable generated!');
      }
    } catch (error) {
      setPreviewTimetable(null);
      console.error('Auto-schedule error:', error);
      toast.error('Failed to auto-schedule timetable');
    }
  };

  // Save preview timetable to DB
  const handleSavePreviewTimetable = async () => {
    if (!previewTimetable) return;
    try {
      // Debug: log the previewTimetable before saving
      console.log('Saving previewTimetable:', previewTimetable);
      const batches = getBatches();
      // Use normalized batch keys for saving
      const timetablesToSave = batches.map(batch => {
        const normBatch = normalizeBatch(batch);
        return {
        semester: selectedSemester,
        batch,
        timetable: Object.fromEntries(
          DAYS.map(day => [day, Object.fromEntries(
              TIME_SLOTS.map(slot => {
                // Try both normalized and display batch keys
                const courseObj = (previewTimetable[day]?.[slot]?.[batch]) ?? (previewTimetable[day]?.[slot]?.[normBatch]) ?? null;
                return [slot, courseObj || null];
              })
            )])
          )
        };
      });
      console.log('Timetables to save:', timetablesToSave);
      await timetableService.saveTimetables(timetablesToSave);
      await fetchAndSetCurrentTimetable();
      setPreviewTimetable(null);
      await fetchSavedTimetables();
      toast.success('Timetable saved to database!');
    } catch (error) {
      toast.error('Error saving timetable: ' + (error.response?.data?.message || error.message));
    }
  };

  // Helper to fetch and set the latest saved timetable for the current semester
  const fetchAndSetCurrentTimetable = async () => {
    try {
      const response = await timetableService.getAllTimetables();
      // Find all timetables for the current semester
      const semesterTimetables = response.filter(tt => String(tt.semester) === String(selectedSemester));
      // Transform backend structure to frontend grid structure
      // Build: timetables[selectedSemester][day][slot][batch] = courseObj
      const mergedTimetable = {};
      for (const tt of semesterTimetables) {
        const batch = tt.batch;
        const timetable = tt.timetable;
        for (const day of Object.keys(timetable)) {
          if (!mergedTimetable[day]) mergedTimetable[day] = {};
          for (const slot of Object.keys(timetable[day])) {
            if (!mergedTimetable[day][slot]) mergedTimetable[day][slot] = {};
            mergedTimetable[day][slot][batch] = timetable[day][slot];
          }
        }
      }
      setTimetables(prev => ({ ...prev, [selectedSemester]: mergedTimetable }));
    } catch (error) {
      console.error('Error fetching latest timetable:', error);
    }
  };

  const handleSaveTimetable = async () => {
    if (!currentTimetableName) {
      alert('Please enter a name for the timetable.');
      return;
    }

    try {
      const timetableData = {
        name: currentTimetableName,
        semester: selectedSemester,
        academicYear: '2024-2025', // Default academic year
        status: 'draft',
        slots: Object.entries(timetables[selectedSemester]).flatMap(([day, slots]) =>
          Object.entries(slots).flatMap(([timeSlot, batches]) =>
            Object.entries(batches).map(([batch, course]) => {
              if (course) {
                return {
                  day, timeSlot, batch,
                  course: {
                    _id: course._id,
                    name: course.name,
                    code: course.code,
                    faculty: course.faculty,
                    department: course.department,
                    semester: course.semester,
                    isLab: course.isLab
                  }
                };
              }
              return null;
            }).filter(Boolean)
          )
        ),
        constraints: constraints,
      };

      const response = await timetableService.saveTimetable(timetableData);
      console.log('Timetable saved:', response);
      alert('Timetable saved successfully!');
      setCurrentTimetableName('');
      setShowSaveModal(false);
      await fetchSavedTimetables();
    } catch (error) {
      console.error('Error saving timetable:', error);
      alert('Failed to save timetable: ' + (error.message || 'An unknown error occurred'));
    }
  };

  const handleLoadTimetable = async (timetableId) => {
    try {
      const response = await timetableService.getTimetable(timetableId);
      setTimetables(prev => ({
        ...prev,
        [selectedSemester]: response.schedule
      }));
      setConstraints(response.constraints);
      setShowLoadModal(false);
    } catch (error) {
      setError('Failed to load timetable');
      console.error('Error loading timetable:', error);
    }
  };

  const handleDeleteTimetable = async (timetableId) => {
    try {
      await timetableService.deleteTimetable(timetableId);
      await fetchSavedTimetables();
    } catch (error) {
      setError('Failed to delete timetable');
      console.error('Error deleting timetable:', error);
    }
  };

  const handleUpdateTimetable = async (timetableId) => {
    try {
      const timetableData = {
        name: currentTimetableName,
        schedule: timetables[selectedSemester],
        constraints: constraints,
        updatedAt: new Date().toISOString()
      };

      await timetableService.updateTimetable(timetableId, timetableData);
      await fetchSavedTimetables();
      setShowSaveModal(false);
      setCurrentTimetableName('');
    } catch (error) {
      setError('Failed to update timetable');
      console.error('Error updating timetable:', error);
    }
  };

  const handleSaveAllBatchTimetables = async () => {
    try {
      const semester = selectedSemester;
      const batches = getBatches();
      const timetablesToSave = batches.map(batch => ({
        semester,
        batch,
        timetable: getBatchTimetable(batch)
      }));
      await timetableService.saveTimetables(timetablesToSave);
      toast.success('All batch timetables saved successfully!');
      fetchSavedTimetables();
    } catch (error) {
      toast.error('Error saving timetables: ' + (error.response?.data?.message || error.message));
    }
  };

  const getBatchTimetable = (batch) => {
    // Returns timetable in { Monday: [...], ... } format for a batch
    const timetable = {};
    DAYS.forEach(day => {
      timetable[day] = TIME_SLOTS.map(slot => timetables[selectedSemester]?.[day]?.[slot]?.[batch] || null);
    });
    return timetable;
  };

  const getPreviewBatchTimetable = (batch) => {
    if (!previewTimetable) return {};
    const normBatch = normalizeBatch(batch);
    const timetable = {};
    DAYS.forEach(day => {
      timetable[day] = TIME_SLOTS.map(slot => previewTimetable?.[day]?.[slot]?.[normBatch] || null);
    });
    return timetable;
  };

  const handleDownloadPreviewExcel = (batch) => {
    const batchTimetable = getPreviewBatchTimetable(batch);
    if (Object.keys(batchTimetable).length === 0) {
      toast.error("No preview timetable to download.");
      return;
    }
    const wsData = [
      ['Day', ...TIME_SLOTS],
      ...DAYS.map(day => [day, ...TIME_SLOTS.map((slot, idx) => {
        const course = batchTimetable[day][idx];
        return course ? `${course.name} (${course.faculty})` : '';
      })])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    XLSX.writeFile(wb, `Preview_Semester${selectedSemester}_${batch}_Timetable.xlsx`);
  };

  const handleDownloadPreviewPDF = (batch) => {
    const batchTimetable = getPreviewBatchTimetable(batch);
    if (Object.keys(batchTimetable).length === 0) {
      toast.error("No preview timetable to download.");
      return;
    }

    const doc = new jsPDF();

    // Mock data for fields not available in component state
    const programme = studentType === 'UG' ? 'B.E.' : 'M.E.';
    const branch = courses.find(c => String(c.semester) === String(selectedSemester))?.department || 'CSE';
    const classAdvisor = 'Dr. S. CHITRAKALA'; // Placeholder
    const displayBatch = batch; // e.g., 'Batch N'
    const normBatch = normalizeBatch(batch); // e.g., 'N'
    // Find room allocation for this batch and semester (robust normalization, with debug logs)
    let classRoom = 'Not Allocated';
    console.log('roomAllocations:', roomAllocations);
    console.log('Looking for:', {
      semester: String(selectedSemester),
      batch: batch,
      normBatch: normalizeBatch(batch),
      courseType: studentType
    });
    const match = roomAllocations.find(r =>
      String(r.semester).trim().toLowerCase() === String(selectedSemester).trim().toLowerCase() &&
      normalizeBatch(r.batch).trim().toLowerCase() === normalizeBatch(batch).trim().toLowerCase() &&
      String(r.courseType).trim().toLowerCase() === String(studentType).trim().toLowerCase()
    );
    console.log('Matched allocation:', match);
    if (match && match.room) classRoom = match.room;
    const wef = new Date().toLocaleDateString('en-GB').replace(/\//g, '.'); // 'DD.MM.YYYY'
    const regulation = 'PG R2023'; // Placeholder

    // Header
    doc.setFontSize(14);
    doc.setFont('times', 'bold');
    doc.text('DEPARTMENT OF COMPUTER SCIENCE AND ENGINEERING', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text('COLLEGE OF ENGINEERING, GUINDY - ANNA UNIVERSITY, CHENNAI', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });
    doc.setFontSize(11);
    doc.text(`TIME TABLE FOR THE ACADEMIC YEAR 2024 - 25 (EVEN SEMESTER)`, doc.internal.pageSize.getWidth() / 2, 29, { align: 'center' });
    
    // Metadata
    doc.setFont('times', 'normal');
    doc.setFontSize(10);
    const metaData = [
        [`PROGRAMME WITH SEMESTER AND BRANCH : ${selectedSemester} SEMESTER ${programme} (${branch})`, `W.E.F. ${wef}`],
        [`CLASS ADVISOR : ${classAdvisor}`, `BATCH : ${displayBatch}`],
        [`CLASS ROOM : ${classRoom}`, `REGULATION: ${regulation}`],
    ];
    
    autoTable(doc, {
        body: metaData,
        startY: 35,
        theme: 'plain',
        styles: { font: 'times', fontSize: 10 },
        columnStyles: { 0: { cellWidth: 130 } }
    });

    // Timetable
    const head = [['DAY', 'HOUR', '1', '2', '3', '4', '', '5', '6', '7', '8']];
    const timeSlots = ['08:30 - 09:20 AM', '09:25 - 10:15 AM', '10:30 - 11:20 AM', '11:25 - 12:15 PM', 'LUNCH BREAK', '01:10 - 02:00 PM', '02:05 - 02:55 PM', '03:00 - 03:50 PM', '03:55 - 04:45 PM'];
    const timeRow = ['', '', ...timeSlots.slice(0, 4), '', ...timeSlots.slice(5, 9)];
    head.push(timeRow);

    const body = DAYS.map(day => {
        const row = [day.toUpperCase(), ''];
        const dayCourses = TIME_SLOTS.map((slot, idx) => {
            const course = batchTimetable[day][idx];
        if (!course) return '';
        let label = '';
        if (course.category === 'Lab' || (course.category === 'Lab Integrated Theory' && course.isLab)) {
          label = 'Lab';
        } else {
          label = 'Theory';
        }
        // Append label as plain text, no HTML
        return `${course.code}\n${course.name}\n${label}`;
        });
        // Insert lunch break as a merged cell (will be handled by colSpan)
        row.push(...dayCourses.slice(0, 4), '', ...dayCourses.slice(4, 8));
        return row;
    });

    autoTable(doc, {
        head: head,
        body: body,
        startY: doc.lastAutoTable.finalY + 2,
        theme: 'grid',
        styles: { font: 'times', fontSize: 8, halign: 'center', valign: 'middle', overflow: 'linebreak' },
        headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0], fontSize: 8 },
        bodyStyles: { minCellHeight: 10 },
        tableWidth: 'auto',
        margin: { left: 9, right: 4 },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold', cellWidth: 22 }, // Day
            1: { halign: 'center', fontStyle: 'bold', cellWidth: 12 }, // Hour (empty)
            2: { cellWidth: 18.5 },
            3: { cellWidth: 18.5 },
            4: { cellWidth: 18.5 },
            5: { cellWidth: 18.5 },
            6: { cellWidth: 8 }, // Lunch break
            7: { cellWidth: 18.5 },
            8: { cellWidth: 18.5 },
            9: { cellWidth: 18.5 },
            10: { cellWidth: 18.5 }
        },
      didParseCell: (data) => {
        // Merge lunch break cell vertically for all days
        if (data.column.index === 6 && data.row.index === 0) {
          data.cell.rowSpan = DAYS.length;
        }
        // Remove text for lunch break cells except the first
        if (data.column.index === 6 && data.row.index > 0) {
          data.cell.text = '';
        }
      },
        didDrawCell: (data) => {
            // Draw vertical 'LUNCH BREAK' only once, as a merged cell
            if (data.section === 'body' && data.column.index === 6 && data.row.index === 0) {
                doc.saveGraphicsState();
                doc.setFont('times', 'bold');
                doc.setFontSize(12); // Larger for visibility
                doc.setTextColor(30, 30, 30); // Darker
                // Center vertically in the merged cell
                doc.text(
                    'LUNCH BREAK',
                    data.cell.x + data.cell.width / 2,
                    data.cell.y + (data.cell.height * DAYS.length) / 2,
                    {
                        angle: 90,
                        align: 'center',
                        baseline: 'middle'
                    }
                );
                doc.restoreGraphicsState();
            }
        // --- Bold 'Lab' or 'Theory' in timetable cells ---
        if (data.section === 'body' && data.cell.text && typeof data.cell.text === 'string') {
          const lines = data.cell.text.split('\n');
          const lastLine = lines[lines.length - 1];
          if (lastLine === 'Lab' || lastLine === 'Theory') {
            // Calculate position for the last line
            const fontSize = data.cell.styles.fontSize || 8;
            const lineHeight = fontSize * 0.35 + 2; // approx
            const y = data.cell.y + 2 + lineHeight * (lines.length - 1);
            const x = data.cell.x + data.cell.width / 2;
            // Erase the last line by drawing a white rectangle
            doc.saveGraphicsState();
            doc.setFillColor(255, 255, 255);
            doc.rect(data.cell.x, y - 1, data.cell.width, lineHeight + 2, 'F');
            // Draw bold text
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(fontSize);
            doc.setTextColor(0, 0, 0);
            doc.text(lastLine, x, y, { align: 'center', baseline: 'top' });
            doc.restoreGraphicsState();
          }
            }
        }
    });

    // Course Details
    const uniqueCourses = {};
    Object.values(batchTimetable).forEach(day => {
        day.forEach(course => {
            if (course && !uniqueCourses[course.code]) {
                uniqueCourses[course.code] = { ...course, faculties: new Set() };
            }
            if(course) {
                uniqueCourses[course.code].faculties.add(course.faculty);
            }
        });
    });

    const courseBody = Object.values(uniqueCourses).map(c => [
        c.code,
        c.name,
        Array.from(c.faculties).join(', '),
        c.category,
        c.credits
    ]);

    autoTable(doc, {
        head: [['COURSE CODE', 'COURSE TITLE', 'FACULTY NAME', 'CATEGORY', 'CREDITS']],
        body: courseBody,
        startY: doc.lastAutoTable.finalY + 10,
        theme: 'grid',
        styles: { font: 'times', fontSize: 10 },
        headStyles: { fontStyle: 'bold', fillColor: [255, 255, 255], textColor: [0, 0, 0] }
    });

    // Footer
    const finalY = doc.lastAutoTable.finalY;
    doc.setFontSize(10);
    doc.setFont('times', 'bold');
    doc.text('TIME TABLE COORDINATOR', 20, finalY + 20);
    doc.text('HoD/CSE', doc.internal.pageSize.getWidth() - 20, finalY + 20, { align: 'right' });


    doc.save(`Preview_Semester${selectedSemester}_${batch}_Timetable.pdf`);
  };

  const handleDownloadExcel = (batch) => {
    const batchTimetable = getBatchTimetable(batch);
    const wsData = [
      ['Day', ...TIME_SLOTS],
      ...DAYS.map(day => [day, ...TIME_SLOTS.map((slot, idx) => {
        const course = batchTimetable[day][idx];
        return course ? `${course.name} (${course.faculty})` : '';
      })])
    ];
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Timetable');
    XLSX.writeFile(wb, `Semester${selectedSemester}_${batch}_Timetable.xlsx`);
  };

  const handleDownloadPDF = (batch) => {
    const batchTimetable = getBatchTimetable(batch);
    const doc = new jsPDF();
    doc.setFontSize(12);
    doc.text(`Semester ${selectedSemester} - ${batch} Timetable`, 10, 10);
    let y = 20;
    doc.text(['Day', ...TIME_SLOTS].join(' | '), 10, y);
    y += 8;
    DAYS.forEach(day => {
      const row = [day, ...TIME_SLOTS.map((slot, idx) => {
        const course = batchTimetable[day][idx];
        return course ? `${course.name} (${course.faculty})` : '';
      })];
      doc.text(row.join(' | '), 10, y);
      y += 8;
      if (y > 270) {
        doc.addPage();
        y = 10;
      }
    });
    doc.save(`Semester${selectedSemester}_${batch}_Timetable.pdf`);
  };

  // Helper to render a batch timetable (for preview or saved)
  const renderBatchTimetable = (batch, timetableObj) => {
    if (!timetableObj) return null;
    const normBatch = normalizeBatch(batch);
    const batchToShow = batch || getBatches().find(b => Object.values(timetableObj || {}).some(daySlots => Object.values(daySlots).some(slotObj => slotObj[normalizeBatch(b)])));
    if (!batchToShow) return <div className="text-white mt-8">No scheduled timetable available.</div>;
    return (
      <div className="overflow-x-auto mt-8" id="scheduled-timetable-section">
        <h2 className="text-xl font-semibold text-white mb-2">Scheduled Timetable for {batchToShow}</h2>
        <table className="min-w-full bg-white border border-gray-300 text-black">
          <thead>
            <tr>
              <th className="border px-2 py-1">Day</th>
              {TIME_SLOTS.map(slot => (
                <th key={slot} className="border px-2 py-1">{slot}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {DAYS.map(day => (
              <tr key={day}>
                <td className="border px-2 py-1 font-semibold">{day}</td>
                {TIME_SLOTS.map(slot => {
                  const course = timetableObj[day]?.[slot]?.[normBatch];
                  return (
                    <td key={slot} className="border px-2 py-1">
                      {course ? (
                        <div>
                          <div>{course.name}</div>
                          <div className="text-xs">{course.faculty}</div>
                          <div className="text-xs">{course.code}</div>
                          <div className="text-xs font-bold">
                            {course.category === 'Lab' || (course.category === 'Lab Integrated Theory' && course.isLab) ? 'Lab' : 'Theory'}
                          </div>
                        <button
                            onClick={e => {
                            e.stopPropagation();
                            handleClearSlot(day, slot, batch);
                          }}
                            className="mt-2 text-red-400 hover:text-red-300 text-xs"
                        >
                          Clear
                        </button>
                      </div>
                    ) : (
                        <div className="text-gray-400 text-xs">-</div>
                    )}
                </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Scroll to timetable after auto-scheduling
  useEffect(() => {
    if (scheduleSuccess) {
      const el = document.getElementById('scheduled-timetable-section');
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  }, [scheduleSuccess, timetables, selectedSemester]);

  // Improved faculty matching function
  const findFacultyForCourse = (course, batch, semester, role) => {
    if (!facultyData || facultyData.length === 0) {
      return { faculty: 'Unassigned', matchType: 'No faculty data' };
    }

    // For Lab Integrated Theory, never assign Lab Assistant
    if (course.category === 'Lab Integrated Theory' && role === 'Lab Assistant') {
      return { faculty: 'Unassigned', matchType: 'Lab Assistant not allowed for Lab Integrated Theory' };
    }

    // Normalize the search parameters
    const searchCourseCode = course.code?.trim();
    const searchCourseName = course.name?.trim();
    const searchBatch = normalizeBatch(batch?.trim());
    const searchSemester = String(semester).trim();
    const searchRole = role?.trim();

    // Only allow assignment if there is an explicit batch match (course code/name + batch + semester + role)
    const batchMatch = facultyData.find(assignment =>
      ((assignment.courseCode?.trim() === searchCourseCode) || (assignment.courseName?.trim() === searchCourseName)) &&
      assignment.batch?.trim() === searchBatch &&
      assignment.role?.trim() === searchRole
    );
    if (batchMatch) {
      return {
        faculty: batchMatch.facultyName,
        matchType: 'Batch-specific match',
        details: `Course: ${batchMatch.courseCode || batchMatch.courseName}, Batch: ${batchMatch.batch}, Semester: ${batchMatch.semester}, Role: ${batchMatch.role}`
      };
    }

    // If no batch-specific assignment, do not fallback to any other batch/role/semester
    return {
      faculty: 'Unassigned',
      matchType: 'No batch-specific match',
      details: `Searched for: Course=${searchCourseCode}/${searchCourseName}, Batch=${searchBatch}, Semester=${searchSemester}, Role=${searchRole}`
    };
  };

  // Diagnostic logic
  const runDiagnostic = () => {
    if (!selectedSemester) {
      alert('Please select a semester first');
      return;
    }
    const batches = getBatches();
    const semesterCourses = courses.filter(course => String(course.semester) === String(selectedSemester) && course.type === studentType);
    const rows = [];
    const norm = s => (s || '').replace(/\s+/g, ' ').trim().toLowerCase();
    const normRole = r => (r || '').replace(/\s+/g, ' ').trim();
    const normBatchKey = b => normalizeBatch((b || '').replace(/\s+/g, ' ').trim());
    for (const course of semesterCourses) {
      for (const batch of batches) {
        let requiredRoles = [];
        if (course.category === 'Lab Integrated Theory') requiredRoles = ['Lab Incharge'];
        else if (course.category === 'Lab') requiredRoles = ['Lab Incharge'];
        else requiredRoles = ['Theory Teacher'];
        for (const role of requiredRoles) {
          const codeMatch = facultyData.find(fa => norm(fa.courseCode) === norm(course.code) && normBatchKey(fa.batch) === normBatchKey(batch) && String(fa.semester) === String(selectedSemester) && normRole(fa.role) === role);
          const nameMatch = facultyData.find(fa => norm(fa.courseName) === norm(course.name) && normBatchKey(fa.batch) === normBatchKey(batch) && String(fa.semester) === String(selectedSemester) && normRole(fa.role) === role);
          let status = '';
          let faculty = '';
          if (codeMatch) { status = 'OK (code match)'; faculty = codeMatch.facultyName; }
          else if (nameMatch) { status = 'OK (name match)'; faculty = nameMatch.facultyName; }
          else {
            // Find partials for debugging
            const partials = facultyData.filter(fa => (norm(fa.courseCode) === norm(course.code) || norm(fa.courseName) === norm(course.name)));
            status = 'MISSING';
            if (partials.length > 0) status += ' (partial match exists, check batch/semester/role)';
          }
          rows.push({
            course: `${course.code} (${course.name})`,
            batch,
            semester: selectedSemester,
            role,
            status,
            faculty
          });
        }
      }
    }
    setDiagnosticRows(rows);
    setShowDiagnosticModal(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="text-red-500 text-center">
          <h2 className="text-2xl font-bold mb-4">Error</h2>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  // Student Type Selection Modal
  if (showTypeSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-8 max-w-md w-full mx-4">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Student Type</h2>
          <div className="space-y-4">
            <button
              onClick={() => handleStudentTypeSelection('UG')}
              className="w-full px-6 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span className="text-xl">👨‍🎓</span>
              <span className="text-lg font-semibold">Undergraduate (UG)</span>
            </button>
            <button
              onClick={() => handleStudentTypeSelection('PG')}
              className="w-full px-6 py-4 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span className="text-xl">🎓</span>
              <span className="text-lg font-semibold">Postgraduate (PG)</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 p-6">
      <ToastContainer />
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <div className="absolute inset-0 bg-white/10 rounded-xl"></div>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
                  <line x1="16" y1="2" x2="16" y2="6"></line>
                  <line x1="8" y1="2" x2="8" y2="6"></line>
                  <line x1="3" y1="10" x2="21" y2="10"></line>
                  <circle cx="12" cy="15" r="3"></circle>
                  <line x1="12" y1="12" x2="12" y2="15"></line>
                  <line x1="12" y1="15" x2="14" y2="15"></line>
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Timetable Builder</h1>
                <p className="text-gray-400 text-sm">Smart Schedule Management - {studentType} Students</p>
              </div>
            </div>
            <div className="h-8 w-px bg-gray-600"></div>
            <div className="flex space-x-2">
              <select
                value={selectedSemester}
                onChange={(e) => handleSemesterChange(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Semester</option>
                {getSemesterOptions().map(sem => (
                  <option key={sem} value={sem}>Semester {sem}</option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (!selectedSemester) {
                    alert('Please select a semester first');
                    return;
                  }
                  
                  const batches = getBatches();
                  const semesterCourses = courses.filter(course =>
                    String(course.semester) === String(selectedSemester) &&
                    course.type === studentType
                  );
                  
                  let detailedInfo = `Detailed Faculty Assignment Analysis for Semester ${selectedSemester} (${studentType}):\n\n`;
                  
                  // Show all faculty assignments for this semester
                  console.log('facultyData sample:', facultyData.slice(0, 10));
                  const semesterAssignments = facultyData.filter(assignment => 
                    String(assignment.semester).trim() === String(selectedSemester).trim() &&
                    (!studentType || assignment.courseType?.trim() === studentType?.trim()) &&
                    assignment.role?.trim() !== 'Lab Assistant'
                  );
                  
                  detailedInfo += `=== ALL FACULTY ASSIGNMENTS FOR SEMESTER ${selectedSemester} ===\n`;
                  semesterAssignments.forEach((assignment, index) => {
                    detailedInfo += `${index + 1}. ${assignment.facultyName.replace(/\s+/g, ' ')} -> ${assignment.courseCode} (${assignment.courseName}) - ${assignment.batch} - ${assignment.role}\n`;
                  });
                  detailedInfo += `\n`;
                  
                  // Show course-by-course analysis
                  detailedInfo += `=== COURSE-BY-COURSE ANALYSIS ===\n`;
                  for (const course of semesterCourses) {
                    detailedInfo += `\n${course.code} (${course.name}) [${course.category}]:\n`;
                    
                    for (const batch of batches) {
                      detailedInfo += `  ${batch}:\n`;
                      
                      // Determine required roles
                      const isLabIntegratedTheory = course.category === 'Lab Integrated Theory';
                      const isLabCourse = course.category === 'Lab';
                      let requiredRoles = [];
                      if (isLabIntegratedTheory) {
                        requiredRoles = ['Lab Incharge'];
                      } else if (isLabCourse) {
                        requiredRoles = ['Lab Incharge']; // Never include Lab Assistant
                      } else {
                        requiredRoles = ['Theory Teacher'];
                      }
                      
                      for (const role of requiredRoles) {
                        detailedInfo += `    ${role}:\n`;
                        
                        // Debug: show all assignments for this course, batch, semester
                        const debugMatches = facultyData.filter(assignment =>
                          assignment.courseCode?.trim() === course.code?.trim() &&
                          normalizeBatch(assignment.batch?.trim()) === normalizeBatch(batch?.trim()) &&
                          String(assignment.semester).trim() === String(selectedSemester).trim()
                        );
                        console.log('Debug matches for', course.code, batch, role, debugMatches);
                        // Show exact matches
                        const exactMatches = facultyData.filter(assignment => 
                          assignment.courseCode?.trim() === course.code?.trim() &&
                          normalizeBatch(assignment.batch?.trim()) === normalizeBatch(batch?.trim()) &&
                          String(assignment.semester).trim() === String(selectedSemester).trim() &&
                          assignment.role?.trim() === role?.trim() &&
                          assignment.role?.trim() !== 'Lab Assistant'
                        );
                        detailedInfo += `      Exact matches: ${exactMatches.length}\n`;
                        exactMatches.forEach(match => {
                          detailedInfo += `        ✓ ${match.facultyName.replace(/\s+/g, ' ')}\n`;
                        });
                        
                        // Show name matches
                        const nameMatches = facultyData.filter(assignment => 
                          assignment.courseName?.trim() === course.name?.trim() &&
                          normalizeBatch(assignment.batch?.trim()) === normalizeBatch(batch?.trim()) &&
                          String(assignment.semester).trim() === String(selectedSemester).trim() &&
                          assignment.role?.trim() === role?.trim() &&
                          assignment.role?.trim() !== 'Lab Assistant'
                        );
                        detailedInfo += `      Name matches: ${nameMatches.length}\n`;
                        nameMatches.forEach(match => {
                          detailedInfo += `        ✓ ${match.facultyName.replace(/\s+/g, ' ')}\n`;
                        });
                        
                        // Show other batch matches
                        const otherBatchMatches = facultyData.filter(assignment => 
                          (assignment.courseCode?.trim() === course.code?.trim() || assignment.courseName?.trim() === course.name?.trim()) &&
                          String(assignment.semester).trim() === String(selectedSemester).trim() &&
                          assignment.role?.trim() === role?.trim() &&
                          assignment.role?.trim() !== 'Lab Assistant' &&
                          normalizeBatch(assignment.batch?.trim()) !== normalizeBatch(batch?.trim())
                        );
                        detailedInfo += `      Other batch matches: ${otherBatchMatches.length}\n`;
                        otherBatchMatches.forEach(match => {
                          detailedInfo += `        ⚠ ${match.facultyName.replace(/\s+/g, ' ')} (from ${match.batch})\n`;
                        });
                        
                        // Show any matches
                        const anyMatches = facultyData.filter(assignment => 
                          (assignment.courseCode?.trim() === course.code?.trim() || assignment.courseName?.trim() === course.name?.trim()) &&
                          String(assignment.semester).trim() === String(selectedSemester).trim() &&
                          assignment.role?.trim() === role?.trim() &&
                          assignment.role?.trim() !== 'Lab Assistant'
                        );
                        detailedInfo += `      Any matches: ${anyMatches.length}\n`;
                        anyMatches.forEach(match => {
                          detailedInfo += `        ? ${match.facultyName.replace(/\s+/g, ' ')} (${match.batch})\n`;
                        });
                        
                        detailedInfo += `\n`;
                      }
                    }
                  }
                  
                  console.log('Detailed analysis:', detailedInfo);
                  alert(detailedInfo);
                }}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-all duration-200 flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Detailed Analysis</span>
              </button>
              <button
                onClick={() => {
                  console.log('=== DATA TYPE ANALYSIS ===');
                  console.log('facultyData length:', facultyData.length);
                  if (facultyData.length > 0) {
                    console.log('First faculty item:', facultyData[0]);
                    console.log('Data types:');
                    console.log('  facultyName type:', typeof facultyData[0].facultyName);
                    console.log('  courseCode type:', typeof facultyData[0].courseCode);
                    console.log('  courseName type:', typeof facultyData[0].courseName);
                    console.log('  batch type:', typeof facultyData[0].batch);
                    console.log('  semester type:', typeof facultyData[0].semester);
                    console.log('  role type:', typeof facultyData[0].role);
                    
                    console.log('\n=== SAMPLE DATA ===');
                    facultyData.slice(0, 5).forEach((item, index) => {
                      console.log(`${index + 1}. ${item.facultyName} -> ${item.courseCode} (${item.courseName}) - ${item.batch} - ${item.semester} - ${item.role}`);
                    });
                    
                    console.log('\n=== SEMESTER ANALYSIS ===');
                    const semesters = [...new Set(facultyData.map(item => item.semester))];
                    console.log('Available semesters:', semesters);
                    
                    console.log('\n=== BATCH ANALYSIS ===');
                    const batches = [...new Set(facultyData.map(item => item.batch))];
                    console.log('Available batches:', batches);
                    
                    console.log('\n=== ROLE ANALYSIS ===');
                    const roles = [...new Set(facultyData.map(item => item.role))];
                    console.log('Available roles:', roles);
                    
                    if (selectedSemester) {
                      console.log(`\n=== SEMESTER ${selectedSemester} ANALYSIS ===`);
                      const semesterData = facultyData.filter(item => String(item.semester) === String(selectedSemester));
                      console.log(`Total assignments for semester ${selectedSemester}:`, semesterData.length);
                      semesterData.forEach((item, index) => {
                        console.log(`${index + 1}. ${item.facultyName} -> ${item.courseCode} - ${item.batch} - ${item.role}`);
                      });
                    }
                  }
                  
                  let dataInfo = `Data Type Analysis:\n\n`;
                  dataInfo += `Total faculty assignments: ${facultyData.length}\n\n`;
                  
                  if (facultyData.length > 0) {
                    dataInfo += `=== SAMPLE DATA ===\n`;
                    facultyData.slice(0, 10).forEach((item, index) => {
                      dataInfo += `${index + 1}. ${item.facultyName} -> ${item.courseCode} (${item.courseName}) - ${item.batch} - ${item.semester} - ${item.role}\n`;
                    });
                    
                    const semesters = [...new Set(facultyData.map(item => item.semester))];
                    dataInfo += `\nAvailable semesters: ${semesters.join(', ')}\n`;
                    
                    const batches = [...new Set(facultyData.map(item => item.batch))];
                    dataInfo += `Available batches: ${batches.join(', ')}\n`;
                    
                    const roles = [...new Set(facultyData.map(item => item.role))];
                    dataInfo += `Available roles: ${roles.join(', ')}\n`;
                    
                    if (selectedSemester) {
                      const semesterData = facultyData.filter(item => String(item.semester) === String(selectedSemester));
                      dataInfo += `\nTotal assignments for semester ${selectedSemester}: ${semesterData.length}\n`;
                    }
                  }
                  
                  alert(dataInfo);
                }}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-all duration-200 flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span>Data Analysis</span>
              </button>
              
              <button
                onClick={autoSchedule}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all duration-200 flex items-center space-x-2"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M9.504 2.308c.515-1.745 3.013-1.745 3.528 0 .378 1.285 1.731 2.015 3.02 1.705 1.543-.34 2.457 1.458 1.884 2.894-.468 1.132-.016 2.518 1.054 3.256 1.127.79 1.127 2.482 0 3.272-1.07 0-1.522 1.93-1.054 3.062.573 1.436-.341 3.234-1.884 2.894-1.289-.31-2.642.42-3.02 1.705-.515 1.745-3.013 1.745-3.528 0-.378-1.285-1.731-2.015-3.02-1.705-1.543.34-2.457-1.458-1.884-2.894.468-1.132.016-2.518-1.054-3.256-1.127-.79-1.127-2.482 0-3.272 1.07-.738 1.522-1.93 1.054-3.062-.573-1.436.341-3.234 1.884-2.894 1.289.31 2.642-.42 3.02-1.705z" clipRule="evenodd" />
                </svg>
                <span>Auto Schedule</span>
              </button>
            </div>
          </div>
        </div>

        {selectedSemester && previewTimetable && (
          <>
            {/* Batch selector for preview timetable */}
            <div className="flex items-center space-x-4 mt-6">
              <label className="text-white font-semibold">Preview Timetable for Batch:</label>
              <select
                value={displayBatch || getBatches()[0]}
                onChange={e => setDisplayBatch(e.target.value)}
                className="px-4 py-2 bg-gray-700 text-white rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select Batch</option>
                {getBatches().map(batch => (
                  <option key={batch} value={batch}>{batch}</option>
                ))}
              </select>
              <button
                className="ml-4 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                onClick={handleSavePreviewTimetable}
              >
                Save Timetable
              </button>
              <button
                className="ml-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                onClick={() => handleDownloadPreviewExcel(displayBatch)}
              >
                Download Excel
              </button>
              <button
                className="ml-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                onClick={() => handleDownloadPreviewPDF(displayBatch)}
              >
                Download PDF
              </button>
            </div>
            {/* Render the preview timetable for the selected batch */}
            {renderBatchTimetable(displayBatch, previewTimetable)}
          </>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full border-separate border-spacing-0">
                  <thead>
                    <tr className="bg-white/5">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider border-b-2 border-gray-400">Time Slot</th>
                      {getBatches().map(batch => (
                        <th key={batch} className="px-4 py-3 text-center text-xs font-medium text-gray-300 uppercase tracking-wider border-b-2 border-gray-400">
                          {batch}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {DAYS.map((day, dayIdx) => (
                      <React.Fragment key={day}>
                        <tr>
                          <td colSpan={1 + getBatches().length} className="bg-gray-800 text-white font-bold px-4 py-2 border-t-4 border-gray-500 text-left">
                            {day}
                          </td>
                        </tr>
                        {TIME_SLOTS.map((slot, slotIdx) => (
                          <tr key={slot} className="border-b border-gray-700">
                            <td className="px-4 py-3 text-sm text-white bg-gray-900/80 border-r border-gray-700 whitespace-nowrap align-middle">
                              {slot}
                            </td>
                            {getBatches().map(batch => {
                              const course = timetables[selectedSemester]?.[day]?.[slot]?.[batch];
                              const isSelected = selectedSlot?.day === day && selectedSlot?.slot === slot && selectedSlot?.batch === batch;
                              return (
                                <td
                                key={batch}
                                  className={`align-middle text-center px-2 py-3 border-r border-gray-700 ${
                                    isSelected
                                      ? 'ring-2 ring-blue-500 bg-blue-900/30'
                                      : course
                                    ? 'bg-blue-500/20 hover:bg-blue-500/30'
                                    : 'bg-gray-700/50 hover:bg-gray-700/70'
                                  } transition-colors duration-200 min-w-[120px] max-w-[180px]`}
                                  style={{ verticalAlign: 'middle' }}
                                onClick={() => handleSlotClick(day, slot, batch)}
                              >
                                  {course ? (
                                  <div className="text-white">
                                      <div className="font-medium truncate">{course.name}</div>
                                      <div className="text-xs text-gray-300 truncate">{course.faculty}</div>
                                      <div className="text-xs text-gray-400">{course.code}</div>
                                      <div className="text-xs font-bold">
                                        {course.category === 'Lab' || (course.category === 'Lab Integrated Theory' && course.isLab) ? 'Lab' : 'Theory'}
                                      </div>
                                    <button
                                        onClick={e => {
                                        e.stopPropagation();
                                        handleClearSlot(day, slot, batch);
                                      }}
                                        className="mt-2 text-red-400 hover:text-red-300 text-xs"
                                    >
                                      Clear
                                    </button>
                                  </div>
                                ) : (
                                    <div className="text-gray-400 text-xs">-</div>
                                )}
                          </td>
                              );
                            })}
                      </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="lg:col-span-1">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-white">Available Courses</h2>
              </div>
              {selectedSlot && (
                <div className="mb-4 p-3 bg-blue-500/20 rounded-lg">
                  <p className="text-white text-sm">
                    Selected: {selectedSlot.day} - {selectedSlot.slot} - {selectedSlot.batch}
                  </p>
                </div>
              )}
              <div className="space-y-3">
                {courses
                  .filter(course => String(course.semester) === String(selectedSemester) && course.type === studentType)
                  .map(course => (
                    <div
                      key={course._id}
                      className={`p-4 rounded-lg cursor-pointer transition-colors duration-200 ${
                        selectedCourse?._id === course._id
                          ? 'bg-blue-500/20'
                          : 'bg-gray-700/50 hover:bg-gray-700/70'
                      }`}
                      onClick={() => handleCourseSelect(course)}
                    >
                      <div className="text-white font-medium mb-1">
                        {course.name}
                      </div>
                      <div className="text-sm text-gray-300 mb-1">
                        <span className="font-semibold">Type:</span> {course.category}
                      </div>
                      <div className="text-xs text-gray-400 mb-2">
                        <span className="font-semibold">Credits:</span> {course.credits}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>

        {/* Save Modal */}
        {showSaveModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-6">Save Timetable</h2>
              <input
                type="text"
                value={currentTimetableName}
                onChange={(e) => setCurrentTimetableName(e.target.value)}
                placeholder="Enter timetable name"
                className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
              />
              <div className="flex justify-end space-x-4">
                <button
                  onClick={() => setShowSaveModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveTimetable}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Load Modal */}
        {showLoadModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-8 max-w-md w-full mx-4">
              <h2 className="text-2xl font-bold text-white mb-6">Load Timetable</h2>
              <div className="space-y-4">
                {savedTimetables
                  .filter(timetable => timetable.semester === selectedSemester)
                  .map(timetable => (
                    <div
                      key={timetable.id}
                      className="flex items-center justify-between p-4 bg-gray-700 rounded-lg"
                    >
                      <div>
                        <h3 className="text-white font-medium">{timetable.name}</h3>
                        <p className="text-sm text-gray-300">
                          Created: {new Date(timetable.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleLoadTimetable(timetable.id)}
                          className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors duration-200"
                        >
                          Load
                        </button>
                        <button
                          onClick={() => handleDeleteTimetable(timetable.id)}
                          className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700 transition-colors duration-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowLoadModal(false)}
                  className="px-4 py-2 text-gray-300 hover:text-white transition-colors duration-200"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TimetableBuilder; 











