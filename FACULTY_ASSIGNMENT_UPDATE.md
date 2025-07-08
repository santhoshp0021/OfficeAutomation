# Faculty Assignment Update - TimetableBuilder

## Overview
Updated the TimetableBuilder page to fetch faculty data from the new `FacultyCourseAssignment` collection instead of the `Faculty` collection for better data consistency and performance.

## Changes Made

### 1. Backend Changes

#### New Model: `FacultyCourseAssignment`
- Created a dedicated collection for faculty course assignments
- Includes indexes on: `courseCode`, `courseName`, `role`, `batch`, `facultyId`, `facultyName`, `semester`, `department`
- Compound indexes for common query patterns
- Stores complete assignment information with timestamps

#### Updated Controller: `facultyController.js`
- Added `populateFacultyAssignments()` method to migrate existing data
- Updated `getAllFaculty()` to use new collection for course assignments
- Added CRUD operations for assignments:
  - `getAssignmentsByFaculty()`
  - `getAssignmentsByCourse()`
  - `getAssignmentsByBatch()`
  - `createAssignment()`
  - `updateAssignment()`
  - `deleteAssignment()`
  - `getAllAssignments()` with pagination and filtering

#### New Routes: `facultyRoutes.js`
- Added `/assignments` endpoint for fetching all assignments
- Added specific endpoints for filtering by faculty, course, batch
- Added CRUD operation endpoints

### 2. Frontend Changes

#### Updated Service: `facultyService.js`
- Added `getFacultyCourseAssignments()` method to fetch from new collection
- Maintains backward compatibility with existing methods

#### Updated TimetableBuilder: `TimetableBuilder.jsx`
- Modified `useEffect` to fetch faculty data from new collection
- Updated `checkConstraints()` function to handle new data structure
- Updated `autoSchedule()` function to use new faculty assignment logic
- Added fallback mechanism to old structure if new endpoint fails

## Data Structure Comparison

### Old Structure (Faculty Collection)
```javascript
{
  _id: ObjectId,
  name: "Dr. John Doe",
  courseHandled: [
    {
      courseCode: "CS101",
      courseName: "Introduction to Programming",
      role: "Theory Teacher",
      batch: "Batch N"
    }
  ]
}
```

### New Structure (FacultyCourseAssignment Collection)
```javascript
{
  _id: ObjectId,
  facultyId: ObjectId,
  facultyName: "Dr. John Doe",
  courseCode: "CS101",
  courseName: "Introduction to Programming",
  semester: "1",
  role: "Theory Teacher",
  batch: "Batch N",
  department: "CSE",
  courseType: "UG"
}
```

## Benefits

1. **Better Performance**: Indexed queries on key fields
2. **Data Consistency**: Dedicated collection for assignments
3. **Easier Management**: Separate CRUD operations for assignments
4. **Scalability**: Better structure for large datasets
5. **Flexibility**: Easy to add new assignment types or fields

## Migration

The system automatically migrates existing data from the Faculty collection to the new FacultyCourseAssignment collection using the `populateFacultyAssignments` script.

## Backward Compatibility

The TimetableBuilder maintains backward compatibility by:
- Checking data structure and using appropriate logic
- Falling back to old method if new endpoint fails
- Supporting both old and new data formats

## Testing

1. Backend endpoint test: `curl http://localhost:5000/api/faculties/assignments`
2. Frontend integration: Navigate to TimetableBuilder and verify faculty assignments work
3. Auto-scheduling: Test that faculty assignments are correctly used in timetable generation

## Usage

The TimetableBuilder now automatically uses the new FacultyCourseAssignment collection for:
- Faculty assignment validation
- Constraint checking
- Auto-scheduling logic
- Course-faculty mapping

No manual intervention required - the system automatically detects and uses the new data structure. 