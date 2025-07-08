## Template Requirements Summary

Based on our implementation, here's how each template now behaves:

### Templates with TABLE ONLY (for multiple entries):
1. **"Viva Claim Internal Examiner" (template1.docx)**
   - Shows: Table with 12 columns for multiple entries
   - Signatures: Chief Superintendent, Head of Department
   - No additional form fields (everything goes in the table)

2. **"Viva Claim Supervisor"**
   - Shows: Table-like data entry
   - Signatures: Supervisor, Chief Superintendent, Head of Department

### Templates with FORM FIELDS ONLY (no table):
3. **"Viva Letter to External"**
   - Shows: 9 specific fields for single letter
   - Fields: External examiner details, viva details, contact info
   - Signatures: Head of Department only
   - NO table data entry

4. **"Viva Claim External Examiner"**
   - Shows: 13 specific fields for external examiner claim
   - Fields: Examiner name, designation, department, fees, etc.
   - Signatures: External Examiner, Chief Superintendent, Head of Department
   - NO table data entry

5. **"Viva External Member Choice - Letter to Chairman"**
   - Shows: 6 specific fields for chairman approval
   - Fields: Department, session date, batch numbers, student details
   - Signatures: Chairman only
   - NO table data entry

### Benefits:
- ✅ No more asking for unnecessary fields
- ✅ Templates with tables focus only on table data entry
- ✅ Templates without tables show relevant form fields
- ✅ Each template shows only its required signatures
- ✅ Users can add multiple table rows as needed
- ✅ Clean, template-specific UI

### User Experience:
When you select "Viva Letter to External", you'll now see:
- Template description
- 9 relevant fields (no table)
- Only "Head of Department" signature option
- Generate PDF/DOCX options

When you select "Viva Claim Internal Examiner", you'll see:
- Table with 12 columns
- "Add Row" button for multiple entries
- Only required signatures (Chief Superintendent, Head of Department)
- No additional form fields (everything is in the table)
