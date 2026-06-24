import { useState, useEffect } from "react"
import { auth } from "../firebase/firebase.js"
import axios from "axios"
import { toast, Toaster } from "react-hot-toast"

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("home")
  const [medicines, setMedicines] = useState([])
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)

  // Add states
  const [medName, setMedName] = useState("")
  const [dosage, setDosage] = useState("")
  const [time, setTime] = useState("")
  const [type, setType] = useState("Tablet")
  const [color, setColor] = useState("#3B82F6")

  // Edit states
  const [editingMed, setEditingMed] = useState(null)
  const [editMedName, setEditMedName] = useState("")
  const [editDosage, setEditDosage] = useState("")
  const [editTime, setEditTime] = useState("")
  const [editType, setEditType] = useState("Tablet")
  const [editColor, setEditColor] = useState("#3B82F6")
  const [comment, setComment] = useState("after meal")
  const [editComment, setEditComment] = useState("after meal")

  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(false)

  // Prescription states
  const [prescriptions, setPrescriptions] = useState([])
  const [selectedFile, setSelectedFile] = useState(null)
  const [viewingPrescription, setViewingPrescription] = useState(null)
  const [uploadLoading, setUploadLoading] = useState(false)
  const [fetchLoading, setFetchLoading] = useState(false)
  
  // Extraction states
  const [extractingId, setExtractingId] = useState(null)
  const [reviewingPrescription, setReviewingPrescription] = useState(null)
  const [tempMedicines, setTempMedicines] = useState([])
  const [savingExtracted, setSavingExtracted] = useState(false)

  // Custom Modal Alert/Confirm state
  const [modalAlert, setModalAlert] = useState(null)

  const showAlert = (msg) => {
    const lower = msg.toLowerCase();
    const isSuccess = lower.includes('success') || lower.includes('save') || lower.includes('update') || msg.includes('✅');
    const isError = lower.includes('error') || lower.includes('fail') || lower.includes('problem') || lower.includes('trouble') || lower.includes('prevent') || lower.includes('unable');
    
    if (isSuccess) {
      toast.success(msg);
    } else if (isError) {
      toast.error(msg);
    } else {
      toast(msg);
    }
  }

  const showConfirm = (msg, onConfirm) => {
    setModalAlert({
      message: msg,
      type: 'confirm',
      onConfirm: onConfirm
    })
  }

  const fetchMedicines = async (token) => {
    try {
      const response = await axios.get('http://localhost:5000/api/medicines', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMedicines(response.data);
    } catch (error) {
      console.error("Fetch Error:", error);
      if (error.response && error.response.status === 401) {
        localStorage.removeItem('token');
        window.location.href = "/login";
      }
    }
  }

  const addMedicine = async (e) => {
    e.preventDefault()
    if (!userId) {
      showAlert("Please log in first!")
      return
    }
    if (medName && dosage && time) {
      setLoading(true)
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post('http://localhost:5000/api/medicines', {
          name: medName,
          dosage,
          time,
          type,
          color,
          comment
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMedicines([response.data, ...medicines])
        setShowAddModal(false)
        setMedName(""); setDosage(""); setTime(""); setComment("after meal")
        showAlert("Medicine saved successfully! ✅")
      } catch (error) {
        console.error("Save Error:", error)
        showAlert("An error occurred while saving the medicine.")
      }
      setLoading(false)
    }
  }

  const openEditModal = (med) => {
    setEditingMed(med)
    setEditMedName(med.name)
    setEditDosage(med.dosage)
    setEditTime(med.time)
    setEditType(med.type)
    setEditColor(med.color)
    setEditComment(med.comment || "after meal")
    setShowEditModal(true)
  }

  const editMedicine = async (e) => {
    e.preventDefault()
    if (!editingMed) return
    setLoading(true)
    try {
      const token = localStorage.getItem('token')
      const response = await axios.put(`http://localhost:5000/api/medicines/${editingMed._id || editingMed.id}`, {
        name: editMedName,
        dosage: editDosage,
        time: editTime,
        type: editType,
        color: editColor,
        comment: editComment
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMedicines(medicines.map(m =>
        (m._id || m.id) === (editingMed._id || editingMed.id) ? response.data : m
      ))
      setShowEditModal(false)
      setEditingMed(null)
      showAlert("Medicine updated successfully! ✅")
    } catch (error) {
      console.error("Update Error:", error)
      showAlert("An error occurred while updating the medicine.")
    }
    setLoading(false)
  }

  const deleteMedicine = async (id) => {
    showConfirm("Are you sure you want to delete this medication?", async () => {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:5000/api/medicines/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedicines(medicines.filter(m => (m._id || m.id) !== id))
        showAlert("Medicine deleted successfully! 🗑️")
      } catch (error) {
        console.error("Delete Error:", error)
        showAlert("An error occurred while deleting the medicine.")
      }
    });
  }

  const fetchPrescriptions = async (token) => {
    setFetchLoading(true)
    try {
      const response = await axios.get('http://localhost:5000/api/prescriptions', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setPrescriptions(response.data);
    } catch (error) {
      console.error("Fetch Prescriptions Error:", error);
    }
    setFetchLoading(false)
  }

  const handleUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showAlert("Please select a file to upload!");
      return;
    }
    setUploadLoading(true);
    try {
      const token = localStorage.getItem('token');
      const formData = new FormData();
      formData.append('prescription', selectedFile);

      const response = await axios.post('http://localhost:5000/api/prescriptions', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      setPrescriptions([response.data, ...prescriptions]);
      setShowUploadModal(false);
      setSelectedFile(null);
      showAlert("Prescription uploaded successfully! ✅");
    } catch (error) {
      console.error("Upload Error:", error);
      showAlert(error.response?.data?.message || "An error occurred while uploading the prescription!");
    }
    setUploadLoading(false);
  };

  const deletePrescription = async (id) => {
    console.log("deletePrescription called with id:", id);
    if (!id) {
      showAlert("Error: Prescription ID not found!");
      return;
    }
    showConfirm("Are you sure you want to delete this prescription?", async () => {
      try {
        const token = localStorage.getItem('token');
        console.log("Sending delete request for ID:", id);
        const res = await axios.delete(`http://localhost:5000/api/prescriptions/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        console.log("Delete response:", res.data);
        setPrescriptions(prev => prev.filter(p => (p._id || p.id) !== id));
        showAlert("Prescription deleted successfully! 🗑️");
      } catch (error) { 
        console.error("Delete Prescription Error:", error);
        showAlert(error.response?.data?.message || "An error occurred while deleting the prescription!");
      }
    });
  };

  // Prescription Extraction Helpers
  const handleExtractOrReview = async (pres) => {
    if (pres.extracted) {
      setTempMedicines(pres.extractedData.map(med => ({
        name: med.name,
        dosage: med.dosage,
        time: med.time,
        type: med.type,
        comment: med.comment,
        color: '#3B82F6'
      })));
      setReviewingPrescription(pres);
    } else {
      setExtractingId(pres._id || pres.id);
      try {
        const token = localStorage.getItem('token');
        const response = await axios.post(`http://localhost:5000/api/prescriptions/${pres._id || pres.id}/extract`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const updatedPres = response.data;
        setPrescriptions(prev => prev.map(p => (p._id || p.id) === (updatedPres._id || updatedPres.id) ? updatedPres : p));
        
        setTempMedicines(updatedPres.extractedData.map(med => ({
          name: med.name,
          dosage: med.dosage,
          time: med.time,
          type: med.type,
          comment: med.comment,
          color: '#3B82F6'
        })));
        setReviewingPrescription(updatedPres);
        showAlert("Prescription extracted successfully! ✅");
      } catch (error) {
        console.error("Extraction Error:", error);
        showAlert(error.response?.data?.message || "Extraction failed. Make sure server .env has GEMINI_API_KEY.");
      }
      setExtractingId(null);
    }
  };

  const handleSaveExtracted = async (e) => {
    e.preventDefault();
    if (!userId) {
      showAlert("Please log in first!");
      return;
    }
    if (tempMedicines.length === 0) {
      showAlert("No medicines to save!");
      return;
    }

    for (const med of tempMedicines) {
      if (!med.name.trim()) {
        showAlert("Please specify a name for all medicines.");
        return;
      }
      if (!med.dosage.trim()) {
        showAlert("Please specify a dosage (e.g. 500mg) for all medicines.");
        return;
      }
      if (!med.time) {
        showAlert("Please specify a time for all medicines.");
        return;
      }
    }

    setSavingExtracted(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:5000/api/medicines/bulk', {
        medicines: tempMedicines
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      await fetchMedicines(token);
      setReviewingPrescription(null);
      setTempMedicines([]);
      showAlert("All medications saved successfully! ✅");
    } catch (error) {
      console.error("Bulk Save Error:", error);
      showAlert("Failed to save medications.");
    }
    setSavingExtracted(false);
  };

  const updateTempMedicineField = (index, field, value) => {
    setTempMedicines(prev => prev.map((med, i) => i === index ? { ...med, [field]: value } : med));
  };

  const addTempMedicineRow = () => {
    setTempMedicines(prev => [...prev, { name: "", dosage: "", time: "07:00", type: "Tablet", comment: "after meal", color: "#3B82F6" }]);
  };

  const deleteTempMedicineRow = (index) => {
    setTempMedicines(prev => prev.filter((_, i) => i !== index));
  };

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setUserId(token)
      fetchMedicines(token)
      fetchPrescriptions(token)
    } else {
      window.location.href = "/login"
    }
  }, [])

  const toggleTaken = async (id) => {
    const med = medicines.find(m => (m._id || m.id) === id)
    if (med) {
      try {
        const token = localStorage.getItem('token')
        const response = await axios.patch(`http://localhost:5000/api/medicines/${id}/toggle`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMedicines(medicines.map(m =>
          (m._id || m.id) === id ? { ...m, taken: response.data.taken } : m
        ))
      } catch (error) {
        console.error("Toggle Error:", error)
        showAlert("An error occurred while updating the status!")
      }
    }
  }

  const takenToday = medicines.filter(m => m.taken).length
  const totalMeds = medicines.length
  const adherenceRate = totalMeds > 0 ? Math.round((takenToday / totalMeds) * 100) : 100

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F8FAFC', fontFamily: 'sans-serif' }}>

      {/* Navbar */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '16px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ width: '40px', height: '40px', backgroundColor: '#2563EB', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '20px' }}>💊</div>
          <div>
            <h1 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>MediTrack</h1>
            <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>Smart Health Companion</p>
          </div>
        </div>

        <button
          onClick={() => showAlert('SOS Emergency Called!')}
          style={{ backgroundColor: '#EF4444', color: 'white', padding: '8px 16px', borderRadius: '999px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer' }}
        >
          📞 SOS Emergency
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('token')
            window.location.href = '/login'
          }}
          style={{ backgroundColor: '#64748B', color: 'white', padding: '8px 16px', borderRadius: '999px', fontSize: '14px', fontWeight: '600', border: 'none', cursor: 'pointer', marginLeft: '8px' }}
        >
          🚪 Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #E2E8F0', padding: '0 32px', display: 'flex', gap: '8px' }}>
        <button
          onClick={() => setActiveTab("home")}
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: activeTab === "home" ? '#2563EB' : 'transparent',
            color: activeTab === "home" ? 'white' : '#64748B',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          🏠 Home
        </button>
        <button
          onClick={() => setActiveTab("medicines")}
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: activeTab === "medicines" ? '#2563EB' : 'transparent',
            color: activeTab === "medicines" ? 'white' : '#64748B',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          💊 Medicines
        </button>
        <button
          onClick={() => setActiveTab("vault")}
          style={{
            padding: '12px 20px',
            border: 'none',
            backgroundColor: activeTab === "vault" ? '#2563EB' : 'transparent',
            color: activeTab === "vault" ? 'white' : '#64748B',
            borderRadius: '8px 8px 0 0',
            cursor: 'pointer',
            fontWeight: '500'
          }}
        >
          📁 Health Vault
        </button>
      </div>

      {/* Content */}
      <div style={{ padding: '32px', maxWidth: '1000px', margin: '0 auto' }}>

        {/* HOME TAB */}
        {activeTab === 'home' && (
          <>
            {medicines.length === 0 && (
              <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
                <p style={{ fontSize: '16px', color: '#0F172A', marginBottom: '16px' }}>No medications scheduled yet</p>
                <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: '#2563EB', color: 'white', padding: '12px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  + Add First Medication
                </button>
              </div>
            )}

            {/* Stats Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginTop: '24px' }}>
              <div style={{ backgroundColor: '#16A34A', padding: '24px', borderRadius: '16px', color: 'white' }}>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{takenToday}</p>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Doses Today</p>
              </div>
              <div style={{ backgroundColor: '#2563EB', padding: '24px', borderRadius: '16px', color: 'white' }}>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{totalMeds}</p>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Active Medicines</p>
              </div>
              <div style={{ background: 'linear-gradient(135deg, #A855F7 0%, #EC4899 100%)', padding: '24px', borderRadius: '16px', color: 'white' }}>
                <p style={{ fontSize: '32px', fontWeight: 'bold', margin: 0 }}>{adherenceRate}%</p>
                <p style={{ margin: '4px 0 0 0', opacity: 0.9 }}>Adherence Rate</p>
              </div>
            </div>

            {/* Today's Schedule */}
            <div style={{ marginTop: '32px' }}>
              <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', marginBottom: '16px' }}>📅 Today's Schedule</h3>
              {medicines.length === 0 ? (
                <p style={{ color: '#94A3B8' }}>No medications added yet</p>
              ) : (
                medicines.map(med => (
                  <div key={med._id || med.id} style={{ backgroundColor: 'white', padding: '16px', borderRadius: '12px', marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', border: `3px solid ${med.color}` }}>
                    <div>
                      <p style={{ fontWeight: '600', color: '#1E293B', margin: '0 0 4px 0' }}>{med.name} {med.dosage}</p>
                      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Time: {med.time} • {med.type} {med.comment ? `• ${med.comment}` : ''}</p>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                      <button 
                        onClick={() => openEditModal(med)} 
                        style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Edit"
                      >
                        ✏️
                      </button>
                      <button 
                        onClick={() => deleteMedicine(med._id || med.id)} 
                        style={{ backgroundColor: '#FEE2E2', color: '#EF4444', padding: '8px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}
                        title="Delete"
                      >
                        🗑️
                      </button>
                      <button onClick={() => toggleTaken(med._id || med.id)} style={{ backgroundColor: med.taken ? '#16A34A' : '#CBD5E1', color: med.taken ? 'white' : '#475569', padding: '8px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>
                        {med.taken ? '✓ Taken' : 'Pending'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </>
        )}

        {/* MEDICINES TAB */}
        {activeTab === 'medicines' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>My Medications</h2>
              <button onClick={() => setShowAddModal(true)} style={{ backgroundColor: '#2563EB', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                + Add Medicine
              </button>
            </div>
            {medicines.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>💊</div>
                <p style={{ fontSize: '16px', color: '#0F172A', marginBottom: '8px' }}>No medications yet</p>
                <p style={{ color: '#64748B', fontSize: '14px' }}>Click "Add Medicine" to get started</p>
              </div>
            ) : (
              medicines.map(med => (
                <div key={med._id || med.id} style={{ backgroundColor: 'white', padding: '20px', borderRadius: '12px', marginBottom: '12px', border: `3px solid ${med.color}`, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: '600', fontSize: '18px', margin: '0 0 8px 0' }}>{med.name}</p>
                    <p style={{ color: '#64748B', margin: 0 }}>{med.dosage} • {med.time} • {med.type} {med.comment ? `• ${med.comment}` : ''}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button 
                      onClick={() => openEditModal(med)} 
                      style={{ backgroundColor: '#F1F5F9', color: '#475569', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                      ✏️ Edit
                    </button>
                    <button 
                      onClick={() => deleteMedicine(med._id || med.id)} 
                      style={{ backgroundColor: '#FEE2E2', color: '#EF4444', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                    >
                      🗑️ Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </>
        )}

        {/* HEALTH VAULT TAB */}
        {activeTab === 'vault' && (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '24px' }}>
              <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Health Vault</h2>
              <button onClick={() => setShowUploadModal(true)} style={{ backgroundColor: '#16A34A', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                ⬆ Upload
              </button>
            </div>
            {fetchLoading ? (
              <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>Loading documents...</div>
            ) : prescriptions.length === 0 ? (
              <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
                <p style={{ fontSize: '16px', color: '#0F172A', marginBottom: '8px' }}>No documents yet</p>
                <p style={{ color: '#64748B', fontSize: '14px' }}>Click "Upload" to add your first health record</p>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                {prescriptions.map(pres => {
                  const isImage = pres.mimeType?.startsWith('image/');
                  const fileSizeKB = Math.round(pres.size / 1024);
                  const uploadDate = new Date(pres.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={pres._id || pres.id} style={{ backgroundColor: 'white', border: '1px solid #E2E8F0', borderRadius: '16px', padding: '16px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)', transition: 'all 0.2s' }}>
                      <div>
                        <div style={{ height: '140px', backgroundColor: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginBottom: '12px', border: '1px solid #F1F5F9' }}>
                          {isImage ? (
                            <img src={`http://localhost:5000/${pres.filePath}`} alt={pres.originalName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            <div style={{ fontSize: '48px' }}>📕</div>
                          )}
                        </div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px', fontWeight: '600', color: '#1E293B', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={pres.originalName}>
                          {pres.originalName}
                        </h4>
                        <p style={{ margin: 0, fontSize: '12px', color: '#94A3B8' }}>Size: {fileSizeKB} KB</p>
                        <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>Uploaded: {uploadDate}</p>
                      </div>
                      
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button 
                          onClick={() => handleExtractOrReview(pres)}
                          disabled={extractingId === pres._id}
                          style={{ 
                            flex: 1, 
                            backgroundColor: pres.extracted ? '#EEF2FF' : '#ECFDF5', 
                            color: pres.extracted ? '#4F46E5' : '#059669', 
                            border: 'none', 
                            borderRadius: '8px', 
                            padding: '8px 12px', 
                            fontSize: '13px', 
                            fontWeight: '600', 
                            cursor: 'pointer', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            gap: '4px',
                            opacity: extractingId === pres._id ? 0.7 : 1
                          }}
                        >
                          {extractingId === pres._id ? '⏳ Extracting...' : pres.extracted ? '📝 Review' : '🔍 Extract'}
                        </button>
                        <button 
                          onClick={() => setViewingPrescription(pres)}
                          style={{ flex: 1, backgroundColor: '#EFF6FF', color: '#2563EB', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                        >
                          👁 View
                        </button>
                        <button 
                          onClick={() => deletePrescription(pres._id || pres.id)}
                          style={{ backgroundColor: '#FEF2F2', color: '#EF4444', border: 'none', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* Add Medicine Modal */}
      {showAddModal && (
        <div onClick={() => setShowAddModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Add New Medication</h3>
            <form onSubmit={addMedicine}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Medicine Name</label>
                  <input value={medName} onChange={(e) => setMedName(e.target.value)} placeholder="e.g., Aspirin" style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Dosage</label>
                  <input value={dosage} onChange={(e) => setDosage(e.target.value)} placeholder="e.g., 100mg" style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Time</label>
                  <input type="time" value={time} onChange={(e) => setTime(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Type</label>
                  <select value={type} onChange={(e) => setType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                    <option>Tablet</option>
                    <option>Syrup</option>
                    <option>Injection</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Meal Comment / Instructions</label>
                  <select value={comment} onChange={(e) => setComment(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                    <option value="after meal">After Meal</option>
                    <option value="before meal">Before Meal</option>
                    <option value="">No special instructions</option>
                  </select>
                </div>
              </div>

              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Color Tag</label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {['#3B82F6', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                  <div key={c} onClick={() => setColor(c)} style={{ width: '40px', height: '40px', backgroundColor: c, borderRadius: '50%', cursor: 'pointer', border: color === c ? '3px solid #1E293B' : '2px solid #E2E8F0' }}></div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={loading} style={{ flex: 1, backgroundColor: '#2563EB', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  {loading ? "Saving..." : "Save Medicine"}
                </button>
                <button type="button" onClick={() => setShowAddModal(false)} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #CBD5E1', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Upload New Document</h3>
            <form onSubmit={handleUpload}>
              <label htmlFor="file-upload" style={{ cursor: 'pointer', display: 'block' }}>
                <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '20px', backgroundColor: selectedFile ? '#F0FDF4' : 'transparent', borderColor: selectedFile ? '#22C55E' : '#CBD5E1' }}>
                  <p style={{ fontSize: '32px', margin: '0 0 8px 0' }}>{selectedFile ? '📄' : '⬆'}</p>
                  <p style={{ fontWeight: '500', color: '#1E293B', margin: '0 0 4px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {selectedFile ? selectedFile.name : 'Click to upload or drag & drop'}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748B', margin: 0 }}>
                    {selectedFile ? `${Math.round(selectedFile.size / 1024)} KB` : 'PDF, JPG, PNG (Max 10MB)'}
                  </p>
                </div>
              </label>
              <input 
                id="file-upload" 
                type="file" 
                accept="image/jpeg,image/png,image/jpg,application/pdf" 
                onChange={(e) => setSelectedFile(e.target.files[0])} 
                style={{ display: 'none' }} 
              />
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <button 
                  type="submit" 
                  disabled={uploadLoading || !selectedFile} 
                  style={{ flex: 1, backgroundColor: '#16A34A', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', opacity: (!selectedFile || uploadLoading) ? 0.6 : 1 }}
                >
                  {uploadLoading ? "Uploading..." : "Save Document"}
                </button>
                <button 
                  type="button" 
                  onClick={() => { setShowUploadModal(false); setSelectedFile(null); }} 
                  style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #CBD5E1', cursor: 'pointer' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Medicine Modal */}
      {showEditModal && (
        <div onClick={() => { setShowEditModal(false); setEditingMed(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Edit Medication</h3>
            <form onSubmit={editMedicine}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Medicine Name</label>
                  <input value={editMedName} onChange={(e) => setEditMedName(e.target.value)} placeholder="e.g., Aspirin" style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Dosage</label>
                  <input value={editDosage} onChange={(e) => setEditDosage(e.target.value)} placeholder="e.g., 100mg" style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Time</label>
                  <input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px', boxSizing: 'border-box' }} required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Type</label>
                  <select value={editType} onChange={(e) => setEditType(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                    <option>Tablet</option>
                    <option>Syrup</option>
                    <option>Injection</option>
                  </select>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Meal Comment / Instructions</label>
                  <select value={editComment} onChange={(e) => setEditComment(e.target.value)} style={{ width: '100%', padding: '10px', border: '1px solid #CBD5E1', borderRadius: '8px' }}>
                    <option value="after meal">After Meal</option>
                    <option value="before meal">Before Meal</option>
                    <option value="">No special instructions</option>
                  </select>
                </div>
              </div>

              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500' }}>Color Tag</label>
              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                {['#3B82F6', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                  <div key={c} onClick={() => setEditColor(c)} style={{ width: '40px', height: '40px', backgroundColor: c, borderRadius: '50%', cursor: 'pointer', border: editColor === c ? '3px solid #1E293B' : '2px solid #E2E8F0' }}></div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="submit" disabled={loading} style={{ flex: 1, backgroundColor: '#2563EB', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>
                  {loading ? "Updating..." : "Update Medicine"}
                </button>
                <button type="button" onClick={() => { setShowEditModal(false); setEditingMed(null); }} style={{ padding: '12px 24px', borderRadius: '8px', border: '1px solid #CBD5E1', cursor: 'pointer' }}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Prescription Modal */}
      {viewingPrescription && (
        <div onClick={() => setViewingPrescription(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '24px', borderRadius: '20px', width: '700px', maxWidth: '95%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: '#1E293B', margin: 0 }}>{viewingPrescription.originalName}</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#64748B' }}>Uploaded on: {new Date(viewingPrescription.createdAt).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
              </div>
              <button onClick={() => setViewingPrescription(null)} style={{ background: '#F1F5F9', border: 'none', width: '32px', height: '32px', borderRadius: '50%', cursor: 'pointer', fontSize: '16px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B' }}>✕</button>
            </div>
            
            <div style={{ flex: 1, overflow: 'auto', backgroundColor: '#F8FAFC', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', border: '1px solid #E2E8F0' }}>
              {viewingPrescription.mimeType?.startsWith('image/') ? (
                <img src={`http://localhost:5000/${viewingPrescription.filePath}`} alt={viewingPrescription.originalName} style={{ maxWidth: '100%', maxHeight: '60vh', objectFit: 'contain', borderRadius: '8px' }} />
              ) : viewingPrescription.mimeType === 'application/pdf' ? (
                <iframe src={`http://localhost:5000/${viewingPrescription.filePath}`} style={{ width: '100%', height: '60vh', border: 'none', borderRadius: '8px' }} title={viewingPrescription.originalName} />
              ) : (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                  <p style={{ fontSize: '48px', margin: '0 0 16px 0' }}>📄</p>
                  <p style={{ fontSize: '16px', fontWeight: '600', color: '#1E293B' }}>Cannot preview this file format.</p>
                  <a href={`http://localhost:5000/${viewingPrescription.filePath}`} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: '12px', backgroundColor: '#2563EB', color: 'white', padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600' }}>Download to View</a>
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '12px' }}>
              <a href={`http://localhost:5000/${viewingPrescription.filePath}`} download style={{ backgroundColor: '#2563EB', color: 'white', padding: '10px 20px', borderRadius: '8px', textDecoration: 'none', fontWeight: '600', fontSize: '14px', marginRight: '10px', display: 'flex', alignItems: 'center' }}>Download</a>
              <button onClick={() => setViewingPrescription(null)} style={{ backgroundColor: '#64748B', color: 'white', padding: '10px 20px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px' }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Review Extracted Medications Modal */}
      {reviewingPrescription && (
        <div onClick={() => { setReviewingPrescription(null); setTempMedicines([]); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1010 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '24px', width: '1200px', maxWidth: '95vw', height: '85vh', maxHeight: '900px', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #E2E8F0' }}>
            
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid #E2E8F0', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0F172A', margin: 0 }}>Review Extracted Medications</h3>
                <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: '#64748B' }}>
                  Verify, edit, or add medications extracted by AI from <strong>{reviewingPrescription.originalName}</strong> before saving.
                </p>
              </div>
              <button onClick={() => { setReviewingPrescription(null); setTempMedicines([]); }} style={{ background: '#F1F5F9', border: 'none', width: '36px', height: '36px', borderRadius: '50%', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748B', transition: 'background-color 0.2s' }}>✕</button>
            </div>
            
            {/* Split Screen Body */}
            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '24px', overflow: 'hidden', minHeight: 0 }}>
              
              {/* Left Column: Prescription File Preview */}
              <div style={{ display: 'flex', flexDirection: 'column', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px solid #E2E8F0', padding: '16px', overflow: 'hidden' }}>
                <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#334155', margin: '0 0 12px 0' }}>📄 Document Reference</h4>
                <div style={{ flex: 1, backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2E8F0', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px' }}>
                  {reviewingPrescription.mimeType?.startsWith('image/') ? (
                    <img src={`http://localhost:5000/${reviewingPrescription.filePath}`} alt="Prescription Reference" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                  ) : reviewingPrescription.mimeType === 'application/pdf' ? (
                    <iframe src={`http://localhost:5000/${reviewingPrescription.filePath}`} style={{ width: '100%', height: '100%', border: 'none', borderRadius: '8px' }} title="Prescription Reference PDF" />
                  ) : (
                    <div style={{ textAlign: 'center', padding: '20px' }}>
                      <span style={{ fontSize: '40px' }}>📄</span>
                      <p style={{ margin: '8px 0 0 0', color: '#64748B', fontSize: '13px' }}>Preview unavailable</p>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right Column: Extracted Medications List Form */}
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '15px', fontWeight: '600', color: '#334155', margin: 0 }}>💊 Medications List ({tempMedicines.length})</h4>
                  <button 
                    type="button" 
                    onClick={addTempMedicineRow} 
                    style={{ backgroundColor: '#F0FDF4', color: '#16A34A', border: '1px dashed #16A34A', padding: '6px 12px', borderRadius: '8px', fontSize: '13px', fontWeight: '600', cursor: 'pointer', transition: 'background-color 0.2s' }}
                  >
                    + Add Medicine Row
                  </button>
                </div>
                
                {/* Scrollable list of medications */}
                <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
                  {tempMedicines.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '60px 20px', backgroundColor: '#F8FAFC', borderRadius: '16px', border: '1px dashed #CBD5E1' }}>
                      <p style={{ color: '#64748B', fontSize: '15px', margin: '0 0 12px 0' }}>No medicines in the list.</p>
                      <button type="button" onClick={addTempMedicineRow} style={{ backgroundColor: '#2563EB', color: 'white', border: 'none', padding: '8px 16px', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}>Add One Now</button>
                    </div>
                  ) : (
                    tempMedicines.map((med, index) => (
                      <div key={index} style={{ backgroundColor: 'white', border: `2px solid ${med.color}`, borderRadius: '16px', padding: '16px', marginBottom: '16px', position: 'relative', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                        
                        {/* Delete row button */}
                        <button 
                          type="button" 
                          onClick={() => deleteTempMedicineRow(index)} 
                          style={{ position: 'absolute', top: '12px', right: '12px', background: '#FEF2F2', border: 'none', width: '28px', height: '28px', borderRadius: '50%', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#EF4444', fontSize: '13px' }}
                          title="Delete Row"
                        >
                          🗑️
                        </button>
                        
                        {/* Fields Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginRight: '32px' }}>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>Medicine Name</label>
                            <input 
                              value={med.name} 
                              onChange={(e) => updateTempMedicineField(index, 'name', e.target.value)} 
                              placeholder="e.g. Paracetamol" 
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} 
                              required 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>Dosage / Strength</label>
                            <input 
                              value={med.dosage} 
                              onChange={(e) => updateTempMedicineField(index, 'dosage', e.target.value)} 
                              placeholder="e.g. 500mg" 
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} 
                              required 
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>Time (Schedule)</label>
                            <select 
                              value={med.time} 
                              onChange={(e) => updateTempMedicineField(index, 'time', e.target.value)} 
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                            >
                              <option value="07:00">Morning (7:00 AM)</option>
                              <option value="13:00">Afternoon (1:00 PM)</option>
                              <option value="21:00">Night (9:00 PM)</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>Type</label>
                            <select 
                              value={med.type} 
                              onChange={(e) => updateTempMedicineField(index, 'type', e.target.value)} 
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                            >
                              <option value="Tablet">Tablet</option>
                              <option value="Syrup">Syrup</option>
                              <option value="Injection">Injection</option>
                            </select>
                          </div>
                          <div style={{ gridColumn: 'span 2' }}>
                            <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', color: '#64748B', marginBottom: '4px' }}>Meal Comment / Instructions</label>
                            <select 
                              value={med.comment} 
                              onChange={(e) => updateTempMedicineField(index, 'comment', e.target.value)} 
                              style={{ width: '100%', padding: '8px 12px', border: '1px solid #CBD5E1', borderRadius: '8px', fontSize: '13px' }}
                            >
                              <option value="after meal">After Meal</option>
                              <option value="before meal">Before Meal</option>
                              <option value="">No special instructions</option>
                            </select>
                          </div>
                        </div>

                        {/* Color selection row */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#64748B' }}>Color Tag:</span>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            {['#3B82F6', '#16A34A', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'].map(c => (
                              <div 
                                key={c} 
                                onClick={() => updateTempMedicineField(index, 'color', c)} 
                                style={{ width: '22px', height: '22px', backgroundColor: c, borderRadius: '50%', cursor: 'pointer', border: med.color === c ? '2px solid #1E293B' : '1px solid #E2E8F0', transform: med.color === c ? 'scale(1.15)' : 'none', transition: 'all 0.1s' }}
                              ></div>
                            ))}
                          </div>
                        </div>

                      </div>
                    ))
                  )}
                </div>
              </div>
              
            </div>
            
            {/* Footer Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '24px', borderTop: '1px solid #E2E8F0', paddingTop: '16px' }}>
              <button 
                type="button" 
                onClick={() => { setReviewingPrescription(null); setTempMedicines([]); }} 
                style={{ padding: '10px 20px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'transparent', cursor: 'pointer', fontWeight: '600', fontSize: '14px', color: '#475569' }}
              >
                Cancel
              </button>
              <button 
                type="button" 
                onClick={handleSaveExtracted} 
                disabled={savingExtracted || tempMedicines.length === 0} 
                style={{ backgroundColor: '#10B981', color: 'white', padding: '10px 24px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600', fontSize: '14px', display: 'flex', alignItems: 'center', gap: '6px', opacity: (savingExtracted || tempMedicines.length === 0) ? 0.6 : 1 }}
              >
                {savingExtracted ? '⏳ Saving...' : '✓ Save to Medications'}
              </button>
            </div>
            
          </div>
        </div>
      )}

      {/* Premium Custom Alert / Confirm Modal */}
      {modalAlert && (
        <div onClick={() => { if (modalAlert.type === 'alert') setModalAlert(null); }} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 2000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '28px', borderRadius: '20px', width: '420px', maxWidth: '90%', textAlign: 'center', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)', border: '1px solid #E2E8F0', transform: 'scale(1)', transition: 'transform 0.2s ease-out' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>
              {modalAlert.message.toLowerCase().includes('success') || modalAlert.message.toLowerCase().includes('save') || modalAlert.message.toLowerCase().includes('update') || modalAlert.message.includes('✅') ? '✅' : modalAlert.message.toLowerCase().includes('delete') || modalAlert.message.includes('🗑️') ? '🗑️' : modalAlert.message.toLowerCase().includes('emergency') || modalAlert.message.toLowerCase().includes('sos') ? '🚨' : '⚠️'}
            </div>
            <h4 style={{ fontSize: '18px', fontWeight: 'bold', color: '#0F172A', margin: '0 0 12px 0' }}>
              {modalAlert.type === 'confirm' ? 'Confirm Action' : 'Notice'}
            </h4>
            <p style={{ fontSize: '14px', color: '#475569', margin: '0 0 24px 0', lineHeight: '1.5' }}>{modalAlert.message}</p>
            
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              {modalAlert.type === 'confirm' ? (
                <>
                  <button 
                    onClick={() => setModalAlert(null)} 
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: '1px solid #CBD5E1', backgroundColor: 'transparent', cursor: 'pointer', fontSize: '14px', fontWeight: '600', color: '#475569' }}
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      if (modalAlert.onConfirm) modalAlert.onConfirm();
                      setModalAlert(null);
                    }} 
                    style={{ flex: 1, padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#EF4444', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                  >
                    Yes, Proceed
                  </button>
                </>
              ) : (
                <button 
                  onClick={() => setModalAlert(null)} 
                  style={{ width: '120px', padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#2563EB', color: 'white', cursor: 'pointer', fontSize: '14px', fontWeight: '600' }}
                >
                  OK
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <Toaster position="top-right" reverseOrder={false} />
    </div>
  )
}