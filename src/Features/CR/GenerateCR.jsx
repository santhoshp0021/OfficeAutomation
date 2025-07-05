import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { UserData } from "../../context/UserContext";
import { toast } from "react-hot-toast";
import SignatureCanvas from 'react-signature-canvas';

const API_BASE = "http://localhost:5000/api/crreport";

export default function GenerateCR() {
  const { user } = UserData();
  const [form, setForm] = useState({
    year: new Date().getFullYear(),
    period: 'december',
    selfAssessment: {
      examResults: "",
      membership: "",
      counts: "",
      contributions: "",
      attachments: [],
    },
    hodSection: {
      performance: {
        controlClass: "",
        studentCounseling: "",
        avgPassPercentage: "",
        classRecords: "",
        contributions: "",
        researchAbility: "",
        professionalStanding: "",
        extraCurricular: "",
        willingness: "",
        lapses: "",
        overallRating: "",
      },
      potential: {
        physicalCapacity: "",
        stability: "",
        mentalCapacity: "",
        aptitude: "",
        abilityToManage: "",
        getAlong: "",
        academicLeadership: "",
        generalAppraisal: "",
        specialRemarks: "",
        fitness: "",
      },
      performanceAssessmentSignature: {
        signatureImage: null,
        date: null,
        station: "DCSE, AU, Chennai"
      },
      potentialAssessmentSignature: {
        signatureImage: null,
        date: null,
        station: "DCSE, AU, Chennai"
      }
    },
    facultyAcknowledgement: {
        remarks: "",
        date: null,
        signatureImage: null,
    },
    facultyFinalSignature: {
        signatureImage: null,
        date: null,
    }
  });
  const [facultyProfile, setFacultyProfile] = useState({});
  const [isHOD, setIsHOD] = useState(false);
  const [pendingCRs, setPendingCRs] = useState([]);
  const [selectedCR, setSelectedCR] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef();
  const facultyAckSignRef = useRef();
  const facultyFinalSignRef = useRef();
  const hodPart1SignRef = useRef(); 
  const hodPart2SignRef = useRef();

  // Define years array at the top to avoid hoisting issues
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 10 }, (_, i) => currentYear - i);

  useEffect(() => {
    setIsHOD(user?.role === "hod");
    if (user?.role === "hod") {
      fetchPendingCRs();
      setLoading(false);
    } else if (user?.userId || user?.facultyId || user?._id) {
      const facultyId = user.userId || user.facultyId || user._id;
      axios
        .get(`http://localhost:5000/api/faculty/${facultyId}`)
        .then((res) => {
          setFacultyProfile(res.data);
          setLoading(false);
        })
        .catch((err) => {
          toast.error("Failed to fetch faculty profile");
          setLoading(false);
        });
    } else {
        setLoading(false);
    }
  }, [user]);

  const fetchPendingCRs = async () => {
    try {
      const response = await axios.get(`${API_BASE}/pending/hod`, {
        headers: { "x-user-email": user.email },
      });
      setPendingCRs(response.data);
    } catch (err) {
      toast.error("Failed to fetch pending CR requests");
    }
  };

  const handleEditCR = async (crId) => {
    try {
      const response = await axios.get(`${API_BASE}/report/${crId}`, {
        headers: { "x-user-email": user.email },
      });
      const crData = response.data;
      crData.hodSection = crData.hodSection || { performance: {}, potential: {} };
      crData.hodSection.performance = crData.hodSection.performance || {};
      crData.hodSection.potential = crData.hodSection.potential || {};
      setSelectedCR(crData);
      setForm(crData);
      setIsEditing(true);
    } catch (err) {
      toast.error("Failed to load CR details for editing");
    }
  };

  const handleViewCR = async (crId) => {
    try {
      const response = await axios.get(`${API_BASE}/report/${crId}`, {
        headers: { "x-user-email": user.email },
      });
       const crData = response.data;
       crData.hodSection = crData.hodSection || { performance: {}, potential: {} };
       crData.hodSection.performance = crData.hodSection.performance || {};
       crData.hodSection.potential = crData.hodSection.potential || {};
       console.log(response.data)
      setSelectedCR(response.data);
      setForm(response.data);
      setIsEditing(false);
    } catch (err) {
      toast.error("Failed to load CR details for viewing");
    }
  };
  
  const handleBackToList = () => {
    setSelectedCR(null);
  };
  
  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSelfAssessmentChange = (e) =>
    setForm({
      ...form,
      selfAssessment: { ...form.selfAssessment, [e.target.name]: e.target.value },
    });
    
  const handleHodChange = (e) => {
    const { name, value } = e.target;
    const [section, field] = name.split('.'); // e.g., "potential.physicalCapacity"
    setForm(prevForm => ({
        ...prevForm,
        hodSection: {
            ...prevForm.hodSection,
            [section]: {
                ...prevForm.hodSection[section],
                [field]: value
            }
        }
    }));
  };

  const handleAttachmentUpload = (e) => {
    setForm({
      ...form,
      selfAssessment: {
        ...form.selfAssessment,
        attachments: Array.from(e.target.files),
      },
    });
  };
  const handleFacultyAcknowledgementChange = (e) => {
    setForm(prevForm => ({
        ...prevForm,
        facultyAcknowledgement: {
            ...prevForm.facultyAcknowledgement,
            [e.target.name]: e.target.value
        }
    }));
};

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      if (isHOD && selectedCR) {
        // HOD submission - update HOD section
        const hodData = {
          ...form.hodSection,
          performanceAssessmentSignature: {
            ...form.hodSection.performanceAssessmentSignature,
            signatureImage: hodPart1SignRef.current?.toDataURL() || null,
            date: new Date(),
          },
          potentialAssessmentSignature: {
            ...form.hodSection.potentialAssessmentSignature,
            signatureImage: hodPart2SignRef.current?.toDataURL() || null,
            date: new Date(),
          }
        };

        await axios.post(`${API_BASE}/${selectedCR._id}/hod-section`, hodData, {
          headers: { "x-user-email": user.email },
        });

        toast.success("HOD section submitted successfully!");
        fetchPendingCRs();
        handleBackToList();

      } else {
        // Faculty submission - create basic CR report for HOD review
        let facultySignatureImage = null;
        let facultyFinalSignatureImage = null;
        
        try {
          // Safely capture signatures with error handling
          if (facultyAckSignRef.current) {
            facultySignatureImage = facultyAckSignRef.current.toDataURL();
          }
          if (facultyFinalSignRef.current) {
            facultyFinalSignatureImage = facultyFinalSignRef.current.toDataURL();
          }
        } catch (error) {
          console.warn('Signature capture failed:', error);
          // Continue without signatures if capture fails
        }
        
        const facultyData = {
          year: form.year,
          period: form.period,
          facultyAcknowledgement: {
            remarks: form.facultyAcknowledgement.remarks,
            date: new Date(),
            signatureImage: facultySignatureImage
          },
          facultyFinalSignature: {
            signatureImage: facultyFinalSignatureImage,
            date: new Date()
          }
        };

        await axios.post(`${API_BASE}/${user.userId || user.facultyId || user._id}`, facultyData, {
          headers: { "x-user-email": user.email },
        });
        toast.success("CR Report submitted for HOD review!");
      }
    } catch (err) {
      toast.error("Failed to submit CR Report");
      console.error('Submit error:', err);
    }
};

  if (loading) {
    return <div className="text-center p-8">Loading...</div>;
  }

  if (isHOD) {
    if (!selectedCR) {
      return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
          <h2 className="text-2xl font-bold text-center mb-6">Pending CR Review Requests</h2>
          {pendingCRs.length === 0 ? (
            <div className="text-center py-8"><p className="text-gray-500">No pending CR requests to review.</p></div>
          ) : (
            <div className="space-y-4">
              {pendingCRs.map((cr) => (
                <div key={cr._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-lg">{cr.faculty?.name}</h3>
                      <p className="text-gray-600">Year: {cr.year}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button onClick={() => handleEditCR(cr._id)} className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600">Review & Fill</button>
                      <button onClick={() => handleViewCR(cr._id)} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">View Only</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      );
    } else {
      return (
        <div className="max-w-4xl mx-auto bg-white p-8 rounded shadow">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold">{isEditing ? "Review & Fill CR Report" : "View CR Report"}</h2>
            <button onClick={handleBackToList} className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600">Back to List</button>
          </div>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-4 rounded-md border p-4">
              <div className="grid grid-cols-[350px_1fr] items-center">
                <span className="font-semibold">1. (a) Name (in block letters)</span>
                <span>: {selectedCR.faculty?.name}</span>
              </div>
              <div className="grid grid-cols-[350px_1fr] items-center">
                <span className="font-semibold"> &nbsp;&nbsp;&nbsp;(b) Date of Birth and Age</span>
                <span>: {selectedCR.faculty?.dob ? `${new Date(selectedCR.faculty.dob).toLocaleDateString()} / ${new Date().getFullYear() - new Date(selectedCR.faculty.dob).getFullYear()} years` : ""}</span>
              </div>
              <div className="grid grid-cols-[350px_1fr] items-center">
                <span className="font-semibold"> &nbsp;&nbsp;&nbsp;(c) Qualifications</span>
                <span>: {selectedCR.faculty?.qualifications}</span>
              </div>
              <div className="grid grid-cols-[350px_1fr] items-center">
                <span className="font-semibold">2. Designation</span>
                <span>: {selectedCR.faculty?.designation}</span>
              </div>
              <div className="grid grid-cols-[350px_1fr] items-center">
                <span className="font-semibold">3. Scale of pay and present pay</span>
                <span>: {selectedCR.faculty?.scaleOfPay} / {selectedCR.faculty?.presentPay}</span>
              </div>
              <div className="grid grid-cols-[350px_1fr] items-start">
                <span className="font-semibold leading-tight">4. Post or posts held and nature of appointment <br /><span className="text-sm font-normal">(i.e. Temporary / Probationer / Approved Probationer / Permanent)</span></span>
                <span>: {selectedCR.faculty?.postHeld}</span>
              </div>
            </div>
             <div className="space-y-2 rounded-md border p-4">
               <h3 className="text-lg font-bold">Part I: Performance Assessment (for HOD)</h3>
               <div className="font-semibold">5. Ability as a teacher as evidenced from the performance of students in the subject taught by him:</div>
               <div className="ml-6">i) Control over the class and popularity among students: <input name="performance.controlClass" value={form.hodSection.performance?.controlClass || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
               <div className="ml-6">ii) Students counselling and interest in student welfare: <input name="performance.studentCounseling" value={form.hodSection.performance?.studentCounseling || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
               <div className="ml-6">iii) Average percentage of pass in the subject taught by him: <input name="performance.avgPassPercentage" value={form.hodSection.performance?.avgPassPercentage || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
               <div><span className="font-semibold">6.* Comments on maintenance of class records, thoroughness and promptness in internal evaluation:</span><input name="performance.classRecords" value={form.hodSection.performance?.classRecords || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
               <div><span className="font-semibold">7. Contributions to the development of the institution based on Ability to training, Planning and Building Laboratory facilities, like models and demonstration equipment. preparation of guides bulletins etc. for the use of students, designing new courses of study and improving the existing ones, and all contributions that promote efficiency and progress in instruction and training.</span><textarea name="performance.contributions" value={form.hodSection.performance?.contributions || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} rows="3"></textarea></div>
               <div><span className="font-semibold">8. Interest in and ability for research (basic and or applied). The area of research may include Science, Engineering or Humanities pertinent to the curriculum, teaching methods and techniques, and other educational problems, human relations in so far as they involve student discipline, team work, cooperation and administration. Credit may also be given for development of instruments and fabrication of equipment of note and worthy character. List of papers published, if any, during the period of report.</span><textarea name="performance.researchAbility" value={form.hodSection.performance?.researchAbility || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} rows="3"></textarea></div>
               <div><span className="font-semibold">9. Professional standing, academic qualification, authorship of books, consulting practice, membership of professional bodies, committees and participation in their activities, upto date knowledge and proficiency in the subjects handled.</span><input name="performance.professionalStanding" value={form.hodSection.performance?.professionalStanding || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
               <div><span className="font-semibold">10. Extra-curricular responsibilities held:</span><input name="performance.extraCurricular" value={form.hodSection.performance?.extraCurricular || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
               <div><span className="font-semibold">11. Willingness to accept such work and co-operate with the administration:</span><input name="performance.willingness" value={form.hodSection.performance?.willingness || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
               <div><span className="font-semibold">12. Lapses pointed out/punishment awarded during the period under report.:</span><input name="performance.lapses" value={form.hodSection.performance?.lapses || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
               <div><span className="font-semibold">13. ** Reporting officer's overall rating of the officer reported on.:</span><input name="performance.overallRating" value={form.hodSection.performance?.overallRating || ''} onChange={handleHodChange} className="w-full rounded border px-2 py-1 mt-1" disabled={!isEditing} /></div>
              
               <div className="mt-6">
                  <div className="grid grid-cols-2 gap-4">
                     <div>
                        <div><span className="font-semibold">Station:</span> {form.hodSection.performanceAssessmentSignature?.station || 'DCSE, AU, Chennai'}</div>
                        <div><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</div>
                     </div>
                     <div className="text-right">
                        <p className="font-semibold">Signature</p>
                        {isEditing ? (
                        <>
                        <SignatureCanvas ref={hodPart1SignRef} penColor='black' canvasProps={{ className: 'bg-gray-100 border rounded w-full h-32 mt-2' }} />
                        <div className="text-right mt-1">
                           <button type="button" onClick={() => hodPart1SignRef.current.clear()} className="text-sm text-gray-600 hover:text-gray-900">Clear</button>
                        </div>
                        </>
                        ) : (
                        selectedCR.hodSection?.performanceAssessmentSignature?.signatureImage && (
                        <img src={selectedCR.hodSection.performanceAssessmentSignature.signatureImage} alt="HOD Signature" className="w-48 h-24 mt-2 border ml-auto" />
                        )
                        )}
                        <div className="mt-4 font-semibold">( {user.name} )</div>
                        <div>( Reporting Officer )</div>
                     </div>
                  </div>
               </div>
            </div>
            <div className="space-y-4 rounded-md border p-4 mt-6">

<div className="text-center font-serif text-sm">
    <p className="mb-2">//3//</p>
    <p className="font-bold text-base">PART II Potential Assessment</p>
</div>
<div className="mt-4 space-y-2 text-sm">
    <div className="grid grid-cols-[200px_1fr] items-center">
        <span className="font-semibold">Name of the Officer:</span>
        <span>{selectedCR.faculty?.name}</span>
    </div>
    <div className="grid grid-cols-[200px_1fr] items-center">
        <span className="font-semibold">Designation:</span>
        <span>{selectedCR.faculty?.designation}</span>
    </div>
    <div className="grid grid-cols-[240px_1fr] items-center">
        <span className="font-semibold">Report for the Year / Half-year ending:</span>
        <div className="flex items-center space-x-2">
             <select name="period" value={form.period} className="border rounded px-2 py-1 bg-gray-200 text-sm" disabled>
                <option value="december">December 31</option>
                <option value="june">June 30</option>
            </select>
            <select name="year" value={form.year} className="border rounded px-2 py-1 bg-gray-200 text-sm" disabled>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    </div>
</div>

               {/* Section A */}
               <div className="pt-2">
                  <label className="font-bold">A. (i) Physical Capacity and general demeanour</label>
                  <input type="text" name="potential.physicalCapacity" value={form.hodSection.potential?.physicalCapacity || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
                  <label className="font-bold mt-2 block">(ii) Stability, Poise, Fairness, Dependability</label>
                  <input type="text" name="potential.stability" value={form.hodSection.potential?.stability || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
                  <label className="font-bold mt-2 block">(iii) Mental Capacity: Analytical ability, power of expression, ability to participate in discussions.</label>
                  <input type="text" name="potential.mentalCapacity" value={form.hodSection.potential?.mentalCapacity || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
               </div>

               {/* Section B */}
               <div className="pt-2">
                  <label className="font-bold">B. (i) Aptitude for work: Aptitude, initiative, self-reliance, thoroughness, sense of responsibility</label>
                  <input type="text" name="potential.aptitude" value={form.hodSection.potential?.aptitude || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
                  <label className="font-bold mt-2 block">(ii) Ability to manage: Capacity to take decisions, ability to plan and programme, supervise and guide and control</label>
                  <input type="text" name="potential.abilityToManage" value={form.hodSection.potential?.abilityToManage || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
               </div>

               {/* Section C */}
               <div className="pt-2">
                  <label className="font-bold">C. (i) Ability to get along: Tact, helpfulness to fellow official, subordinates and to the public</label>
                  <input type="text" name="potential.getAlong" value={form.hodSection.potential?.getAlong || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
                  <label className="font-bold mt-2 block">(ii) Potential for Academic leadership.</label>
                  <input type="text" name="potential.academicLeadership" value={form.hodSection.potential?.academicLeadership || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
                  <label className="font-bold mt-2 block">(iii) General appraisal of the officers good and bad qualities in a narrative form, particularly those pertaining to his / her integrity and ability to correct himself/herself, if his faults are pointed out.</label>
                  <input type="text" name="potential.generalAppraisal" value={form.hodSection.potential?.generalAppraisal || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
                  <label className="font-bold mt-2 block">(iv) Special remarks or commendations if any.</label>
                  <input type="text" name="potential.specialRemarks" value={form.hodSection.potential?.specialRemarks || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
               </div>
               
               {/* Section D */}
               <div className="pt-2">
                  <label className="font-bold">D. Fitness for regularization / Declaration of completion of probation / confirmation / promotion.</label>
                  <input type="text" name="potential.fitness" value={form.hodSection.potential?.fitness || ''} onChange={handleHodChange} disabled={!isEditing} className="w-full rounded border px-3 py-2 mt-1" />
               </div>

               {/* HOD Signature for Part II */}
               <div className="grid grid-cols-2 gap-4 pt-4">
                  <div>
                     <div><span className="font-semibold">Station:</span> {form.hodSection.potentialAssessmentSignature?.station || 'DCSE, AU, Chennai'}</div>
                     <div><span className="font-semibold">Date:</span> {new Date().toLocaleDateString()}</div>
                  </div>
                  <div className="text-right">
                     <p className="font-semibold">Signature of the Reporting Officer</p>
                     {isEditing ? (
                     <>
                     <SignatureCanvas ref={hodPart2SignRef} penColor='black' canvasProps={{ className: 'bg-gray-100 border rounded w-full h-32 mt-2' }} />
                     <div className="text-right mt-1">
                        <button type="button" onClick={() => hodPart2SignRef.current.clear()} className="text-sm text-gray-600 hover:text-gray-900">Clear</button>
                     </div>
                     </>
                     ) : (
                     selectedCR.hodSection?.potentialAssessmentSignature?.signatureImage && (
                     <img src={selectedCR.hodSection.potentialAssessmentSignature.signatureImage} alt="HOD Signature" className="w-48 h-24 mt-2 border ml-auto" />
                     )
                     )}
                     <p>(Name in block letters and Designation)</p>
                  </div>
               </div>
            </div>
            {isEditing && selectedCR.status === 'pending_hod_review' && (
               <button type="submit" className="w-full bg-[#145DA0] text-white py-2 rounded hover:bg-[#0f4a7a]">Submit HOD Review & Finalize Report</button>
            )}
            
            {/* Faculty Signature Sections - Show in HOD View */}
            {!isEditing && (
              <>
                {/* Faculty Acknowledgement Signature */}
                <div className="space-y-4 rounded-md border p-4 mt-6">
                  <p className="font-semibold">Faculty Acknowledgement for having seen the report Part – I for the above period.</p>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <div><span className="font-semibold">Station:</span><span className="ml-2">{selectedCR.faculty?.department || 'DCSE, AU, Chennai'}</span></div>
                      <div><span className="font-semibold">Date:</span><span className="ml-2">{selectedCR.facultyAcknowledgement?.date ? new Date(selectedCR.facultyAcknowledgement.date).toLocaleDateString() : new Date().toLocaleDateString()}</span></div>
                    </div>
                    <div className="text-left">
                      <div>Signature:</div>
                      {selectedCR.facultyAcknowledgement?.signatureImage ? (
                        <img src={selectedCR.facultyAcknowledgement.signatureImage} alt="Faculty Acknowledgement Signature" className="w-48 h-24 mt-2 border" />
                      ) : (
                        <div className="w-48 h-24 mt-2 border flex items-center justify-center text-gray-400">[Not Signed]</div>
                      )}
                      <div className="mt-4 font-semibold">{selectedCR.faculty?.name?.toUpperCase()}</div>
                      <div className="text-sm">({selectedCR.faculty?.designation})</div>
                      <div className="text-sm">(Name in Block letters and Designation)</div>
                    </div>
                  </div>
                </div>

                {/* Faculty Final Signature */}
                <div className="space-y-4 rounded-md border p-4 mt-6">
                  <div>
                    <span className="font-semibold">Faculty Remarks: {selectedCR.facultyAcknowledgement?.remarks || 'No remarks provided'}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 pt-4">
                    <div>
                      <div><span className="font-semibold">Station:</span><span className="ml-2">{selectedCR.faculty?.department || 'DCSE, AU, Chennai'}</span></div>
                      <div><span className="font-semibold">Date:</span><span className="ml-2">{selectedCR.facultyFinalSignature?.date ? new Date(selectedCR.facultyFinalSignature.date).toLocaleDateString() : new Date().toLocaleDateString()}</span></div>
                    </div>
                    <div className="text-left">
                      <div><span className="font-semibold">Signature:</span></div>
                      {selectedCR.facultyAcknowledgement?.signatureImage ? (
                        <img src={selectedCR.facultyAcknowledgement.signatureImage} alt="Faculty Final Signature" className="w-48 h-24 mt-2 border" />
                      ) : (
                        <div className="w-48 h-24 mt-2 border flex items-center justify-center text-gray-400">[Not Signed]</div>
                      )}
                      <div className="mt-4 font-semibold">{selectedCR.faculty?.name?.toUpperCase()}</div>
                      <div className="text-sm">({selectedCR.faculty?.designation})</div>
                      <div className="text-sm">(Name in Block letters and Designation)</div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </form>
        </div>
      );
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6 rounded bg-white p-8 shadow">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold">ANNA UNIVERSITY CHENNAI</h2>
        <h3 className="text-lg font-semibold">PERFORMANCE AND POTENTIAL ASSESSMENT</h3>
        <p className="text-sm">(For Teaching staff other than Deans/Head of the Institutions)</p>
        <p className="font-semibold mt-2">Part I Performance Assessment</p>
        <div className="flex justify-center items-center space-x-2 mt-2">
            <span>For the year / Half year ending</span>
            <select name="period" value={form.period} onChange={handleChange} className="border rounded px-2 py-1">
                <option value="december">December 31</option>
                <option value="june">June 30</option>
            </select>
            <select name="year" value={form.year} onChange={handleChange} className="border rounded px-2 py-1">
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
      </div>
      <div className="space-y-4 rounded-md border p-4">
        <div className="grid grid-cols-[350px_1fr] items-center">
          <span className="font-semibold">1. (a) Name (in block letters)</span>
          <span className="font-mono">: {facultyProfile.name}</span>
        </div>
        <div className="grid grid-cols-[350px_1fr] items-center">
          <span className="font-semibold"> &nbsp;&nbsp;&nbsp;(b) Date of Birth and Age</span>
          <span className="font-mono">: {facultyProfile.dob ? `${new Date(facultyProfile.dob).toLocaleDateString()} / ${new Date().getFullYear() - new Date(facultyProfile.dob).getFullYear()} years` : ""}</span>
        </div>
        <div className="grid grid-cols-[350px_1fr] items-center">
          <span className="font-semibold"> &nbsp;&nbsp;&nbsp;(c) Qualifications</span>
          <span className="font-mono">: {facultyProfile.areasOfExpertise?.join(", ")}</span>
        </div>
        <div className="grid grid-cols-[350px_1fr] items-center">
          <span className="font-semibold">2. Designation</span>
          <span className="font-mono">: {facultyProfile.position}</span>
        </div>
        <div className="grid grid-cols-[350px_1fr] items-center">
          <span className="font-semibold">3. Scale of pay and present pay</span>
          <span className="font-mono">: {facultyProfile.scaleOfPay} / {facultyProfile.presentPay}</span>
        </div>
        <div className="grid grid-cols-[350px_1fr] items-start">
          <span className="font-semibold leading-tight">4. Post or posts held and nature of appointment <br /><span className="text-sm font-normal">(i.e. Temporary / Probationer / Approved Probationer / Permanent)</span></span>
          <span className="font-mono">: {facultyProfile.natureOfAppointment}</span>
        </div>
      </div>

       <div className="space-y-2 rounded-md border p-4 mt-4">
         <h3 className="text-lg font-bold">Part I: Performance Assessment (HOD Review)</h3>
         <div className="font-semibold">5. Ability as a teacher as evidenced from the performance of students in the subject taught by him:</div>
         <div className="ml-6">i) Control over the class and popularity among students: <input value={form.hodSection.performance?.controlClass || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
         <div className="ml-6">ii) Students counselling and interest in student welfare: <input value={form.hodSection.performance?.studentCounseling || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
         <div className="ml-6">iii) Average percentage of pass in the subject taught by him: <input value={form.hodSection.performance?.avgPassPercentage || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
         <div><span className="font-semibold">6.* Comments on maintenance of class records,thoroughness and promptness in internal evaluation:</span><input value={form.hodSection.performance?.classRecords || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
         <div><span className="font-semibold">7. Contributions to the development of the institution based on Ability to training, Planning and Building Laboratory facilities, like models and demonstration equipment. preparation of guides bulletins etc. for the use of students, designing new courses of study and improving the existing ones, and all contributions that promote efficiency and progress in instruction and training.</span><textarea value={form.hodSection.performance?.contributions || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled rows="3"></textarea></div>
         <div><span className="font-semibold">8. Interest in and ability for research (basic and or applied). The area of research may include Science, Engineering or Humanities pertinent to the curriculum, teaching methods and techniques, and other educational problems, human relations in so far as they involve student discipline, team work, cooperation and administration. Credit may also be given for development of instruments and fabrication of equipment of note and worthy character. List of papers published, if any, during the period of report.</span><textarea value={form.hodSection.performance?.researchAbility || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled rows="3"></textarea></div>
         <div><span className="font-semibold">9. Professional standing, academic qualification, authorship of books, consulting practice, membership of professional bodies, committees and participation in their activities, upto date knowledge and proficiency in the subjects handled.</span><input value={form.hodSection.performance?.professionalStanding || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
         <div><span className="font-semibold">10. Extra-curricular responsibilities held:</span><input value={form.hodSection.performance?.extraCurricular || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
         <div><span className="font-semibold">11. Willingness to accept such work and co-operate with the administration:</span><input value={form.hodSection.performance?.willingness || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
         <div><span className="font-semibold">12. Lapses pointed out/punishment awarded during the period under report.:</span><input value={form.hodSection.performance?.lapses || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
         <div><span className="font-semibold">13. ** Reporting officer's overall rating of the officer reported on.:</span><input value={form.hodSection.performance?.overallRating || ''} className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled /></div>
      
         <div className="mt-6">
            <div className="grid grid-cols-2 gap-4">
               <div>
                  <div><span className="font-semibold">Station:</span> {form.hodSection.performanceAssessmentSignature?.station}</div>
                  <div><span className="font-semibold">Date:</span> {form.hodSection.performanceAssessmentSignature?.date ? new Date(form.hodSection.performanceAssessmentSignature.date).toLocaleDateString() : ''}</div>
               </div>
               <div className="text-right">
                  <div>Signature</div>
                  {form.hodSection?.performanceAssessmentSignature?.signatureImage ? (
                  <img src={form.hodSection.performanceAssessmentSignature.signatureImage} alt="HOD Signature" className="w-48 h-24 mt-2 border ml-auto" />
                  ) : (
                  <div className="w-48 h-24 mt-2 border ml-auto flex items-center justify-center text-gray-400">[Not Signed]</div>
                  )}
                  <div className="mt-4 font-semibold">( {form.hodSection?.hodSignature || 'HOD'} )</div>
                  <div>( Reporting Officer )</div>
               </div>
            </div>
         </div>
       </div>

       <div className="space-y-4 rounded-md border p-4 mt-6">
         <div>
           <span className="font-semibold">Remarks of the intermediate reporting officer (if he disagrees with any of the remarks of the Reporting Officer, he should give specific reasons therefor; if he agrees, he should record his opinion to that effect)</span>
           <textarea className="w-full rounded border px-2 py-1 mt-1 bg-gray-100" disabled rows="4" />
         </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div>
            <div><span className="font-semibold">Station:</span></div>
            <div><span className="font-semibold">Date:</span></div>
          </div>
          <div className="text-left">
            <div><span className="font-semibold">Signature:</span></div>
            {form.facultyFinalSignature?.signatureImage ? (
              <img src={form.facultyFinalSignature.signatureImage} alt="Faculty Final Signature" className="w-48 h-24 mt-2 border" />
            ) : (
              <>
                <SignatureCanvas 
                    ref={facultyFinalSignRef}
                    penColor='black'
                    canvasProps={{className: 'bg-gray-100 border rounded w-full h-32'}} 
                />
                <div className="flex space-x-2 mt-2">
                    <button type="button" onClick={() => facultyFinalSignRef.current.clear()} className="text-sm text-gray-600 hover:text-gray-900">Clear</button>
                </div>
              </>
            )}
            <div className="mt-4 font-semibold">{user.name.toUpperCase()}</div>
            <div className="text-sm">({facultyProfile.position})</div>
            <div className="text-sm">(Name in Block letters and Designation)</div>
          </div>
        </div>
      </div>

      <div className="space-y-4 rounded-md border p-4 mt-6">
        <p className="font-semibold">Acknowledgement for having seen the report Part – I for the above period.</p>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div>
            <div><span className="font-semibold">Station:</span><span className="ml-2">{facultyProfile.department}</span></div>
            <div><span className="font-semibold">Date:</span><span className="ml-2">{new Date().toLocaleDateString()}</span></div>
          </div>
          <div className="text-left">
            <div>Signature:</div>
            {form.facultyAcknowledgement?.signatureImage ? (
              <img src={form.facultyAcknowledgement.signatureImage} alt="Faculty Signature" className="w-48 h-24 mt-2 border" />
            ) : (
              <>
                <SignatureCanvas 
                    ref={facultyAckSignRef}
                    penColor='black'
                    canvasProps={{className: 'bg-gray-100 border rounded w-full h-32'}} 
                />
                <div className="flex space-x-2 mt-2">
                    <button type="button" onClick={() => facultyAckSignRef.current.clear()} className="text-sm text-gray-600 hover:text-gray-900">Clear</button>
                </div>
              </>
            )}
            <div className="mt-4 font-semibold">{user.name.toUpperCase()}</div>
            <div className="text-sm">({facultyProfile.position})</div>
            <div className="text-sm">(Name in Block letters and Designation)</div>
          </div>
        </div>
      </div>

      <div className="text-sm mt-6">
        <p><span className="font-bold">Note:-</span> * This response is to be based on the maintenance of attendance register, record of class work etc. maintained by the faculty member.</p>
        <p><span className="font-bold">**</span> The overall rating should be on the five point scale namely, (i) Outstanding (ii) Very Good (iii) Good (iv) Satisfactory (v) Poor.</p>
      </div>

           {/* Read-Only Part II */}
           <div className="space-y-4 rounded-md border p-4 mt-6">
        <h3 className="text-lg font-bold text-center">PART II: Potential Assessment (Read-only view)</h3>
      

<div className="text-center font-serif text-sm mt-4">
    <p className="mb-2">//3//</p>
    <p className="font-bold text-base">PART II Potential Assessment</p>
</div>
<div className="mt-4 space-y-2 text-sm">
    <div className="grid grid-cols-[200px_1fr] items-center">
        <span className="font-semibold">Name of the Officer:</span>
        <span>{facultyProfile.name}</span>
    </div>
    <div className="grid grid-cols-[200px_1fr] items-center">
        <span className="font-semibold">Designation:</span>
        <span>{facultyProfile.position}</span>
    </div>
    <div className="grid grid-cols-[240px_1fr] items-center">
        <span className="font-semibold">Report for the Year / Half-year ending:</span>
        <div className="flex items-center space-x-2">
             <select name="period" value={form.period} className="border rounded px-2 py-1 bg-gray-200 text-sm" disabled>
                <option value="december">December 31</option>
                <option value="june">June 30</option>
            </select>
            <select name="year" value={form.year} className="border rounded px-2 py-1 bg-gray-200 text-sm" disabled>
              {years.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
        </div>
    </div>
</div>
        <div className="pt-2"><label className="font-bold">A. (i) Physical Capacity and general demeanour</label><input value={form.hodSection.potential?.physicalCapacity || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold mt-2 block">(ii) Stability, Poise, Fairness, Dependability</label><input value={form.hodSection.potential?.stability || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold mt-2 block">(iii) Mental Capacity: Analytical ability, power of expression, ability to participate in discussions.</label><input value={form.hodSection.potential?.mentalCapacity || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold">B. (i) Aptitude for work: Aptitude, initiative, self-reliance, thoroughness, sense of responsibility</label><input value={form.hodSection.potential?.aptitude || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold mt-2 block">(ii) Ability to manage: Capacity to take decisions, ability to plan and programme, supervise and guide and control</label><input value={form.hodSection.potential?.abilityToManage || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold">C. (i) Ability to get along: Tact, helpfulness to fellow official, subordinates and to the public</label><input value={form.hodSection.potential?.getAlong || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold mt-2 block">(ii) Potential for Academic leadership.</label><input value={form.hodSection.potential?.academicLeadership || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold mt-2 block">(iii) General appraisal of the officers good and bad qualities in a narrative form, particularly those pertaining to his / her integrity and ability to correct himself/herself, if his faults are pointed out.</label><input value={form.hodSection.potential?.generalAppraisal || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold mt-2 block">(iv) Special remarks or commendations if any.</label><input value={form.hodSection.potential?.specialRemarks || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
        <div className="pt-2"><label className="font-bold">D. Fitness for regularization / Declaration of completion of probation / confirmation / promotion.</label><input value={form.hodSection.potential?.fitness || ''} className="w-full rounded border px-3 py-2 mt-1 bg-gray-100" disabled /></div>
      </div>

      {/* Display HOD Signature for Part II */}
<div className="grid grid-cols-2 gap-4 pt-4">
    <div>
        <div><span className="font-semibold">Station:</span> {form.hodSection.potentialAssessmentSignature?.station}</div>
        <div><span className="font-semibold">Date:</span> {form.hodSection.potentialAssessmentSignature?.date ? new Date(form.hodSection.potentialAssessmentSignature.date).toLocaleDateString() : ''}</div>
    </div>
    <div className="text-right">
        <p className="font-semibold">Signature of the Reporting Officer</p>
        {form.hodSection?.potentialAssessmentSignature?.signatureImage ? (
            <img src={form.hodSection.potentialAssessmentSignature.signatureImage} alt="HOD Signature" className="w-48 h-24 mt-2 border ml-auto" />
        ) : (
            <div className="w-48 h-24 mt-2 border ml-auto flex items-center justify-center text-gray-400">[Not Signed]</div>
        )}
        <p>(Name in block letters and Designation)</p>
    </div>
</div>

      {/* Final Signature by Faculty */}
<div className="space-y-4 rounded-md border p-4 mt-6">
    <div>
        <span className="font-semibold">Remarks of the Reviewing Officer (If he disagrees with any of the remarks of the Reporting Officer, he should give specific reasons therefor; if he agrees, he should record his opinion to that effect)</span>
        <textarea 
            name="remarks" // Add name attribute
            className="w-full rounded border px-2 py-1 mt-1 bg-white" // Make background white
            rows="3" 
            placeholder="Enter your remarks here..."
            value={form.facultyAcknowledgement.remarks} // Connect to state
            onChange={handleFacultyAcknowledgementChange} // Connect to handler
        />
    </div>
    <div className="grid grid-cols-2 gap-4 pt-4">
        <div>
            <div><span className="font-semibold">Station:</span><span className="ml-2">{facultyProfile.department}</span></div>
            <div><span className="font-semibold">Date:</span><span className="ml-2">{new Date().toLocaleDateString()}</span></div>
        </div>
        <div className="text-left">
            <div><span className="font-semibold">Signature:</span></div>
            {form.facultyFinalSignature?.signatureImage ? (
              <img src={form.facultyFinalSignature.signatureImage} alt="Faculty Final Signature" className="w-48 h-24 mt-2 border" />
            ) : (
              <>
                <SignatureCanvas 
                    ref={facultyFinalSignRef}
                    penColor='black'
                    canvasProps={{className: 'bg-gray-100 border rounded w-full h-32'}} 
                />
                <div className="flex space-x-2 mt-2">
                    <button type="button" onClick={() => facultyFinalSignRef.current.clear()} className="text-sm text-gray-600 hover:text-gray-900">Clear</button>
                </div>
              </>
            )}
            <div className="mt-4 font-semibold">{user.name.toUpperCase()}</div>
            <div className="text-sm">({facultyProfile.position})</div>
            <div className="text-sm">(Name in Block letters and Designation)</div>
        </div>
    </div>
</div>

      <button type="submit" className="w-full bg-[#145DA0] text-white py-2 rounded">Submit for HOD Review</button>
    </form>
  );
}