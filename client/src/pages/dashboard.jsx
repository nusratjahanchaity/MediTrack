import { useState, useEffect } from "react"
import { auth } from "../firebase/firebase.js"
import axios from "axios"

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

  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(false)

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
      alert("Login করেন আগে!")
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
          color
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        setMedicines([response.data, ...medicines])
        setShowAddModal(false)
        setMedName(""); setDosage(""); setTime("")
        alert("Medicine Save হইছে! ✅")
      } catch (error) {
        console.error("Save Error:", error)
        alert("Save করতে Problem হইছে!")
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
        color: editColor
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMedicines(medicines.map(m =>
        (m._id || m.id) === (editingMed._id || editingMed.id) ? response.data : m
      ))
      setShowEditModal(false)
      setEditingMed(null)
      alert("Medicine Update হইছে! ✅")
    } catch (error) {
      console.error("Update Error:", error)
      alert("Update করতে Problem হইছে!")
    }
    setLoading(false)
  }

  const deleteMedicine = async (id) => {
    if (window.confirm("আপনি কি নিশ্চিত এই Medicine-টি ডিলিট করতে চান?")) {
      try {
        const token = localStorage.getItem('token')
        await axios.delete(`http://localhost:5000/api/medicines/${id}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setMedicines(medicines.filter(m => (m._id || m.id) !== id))
        alert("Medicine ডিলিট হইছে! 🗑️")
      } catch (error) {
        console.error("Delete Error:", error)
        alert("ডিলিট করতে Problem হইছে!")
      }
    }
  }

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      setUserId(token)
      fetchMedicines(token)
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
        alert("Status update করতে Problem হইছে!")
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
          onClick={() => alert('SOS Emergency Called!')}
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
                      <p style={{ fontSize: '14px', color: '#64748B', margin: 0 }}>Time: {med.time} • {med.type}</p>
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
                    <p style={{ color: '#64748B', margin: 0 }}>{med.dosage} • {med.time} • {med.type}</p>
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
            <div style={{ backgroundColor: 'white', padding: '60px', borderRadius: '16px', textAlign: 'center', border: '1px solid #E2E8F0' }}>
              <div style={{ fontSize: '48px', marginBottom: '16px' }}>📄</div>
              <p style={{ fontSize: '16px', color: '#0F172A', marginBottom: '8px' }}>No documents yet</p>
              <p style={{ color: '#64748B', fontSize: '14px' }}>Click "Upload" to add your first health record</p>
            </div>
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
        <div onClick={() => setShowUploadModal(false)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ backgroundColor: 'white', padding: '32px', borderRadius: '16px', width: '500px', maxWidth: '90%' }}>
            <h3 style={{ fontSize: '20px', fontWeight: 'bold', marginBottom: '20px' }}>Upload New Document</h3>
            <div style={{ border: '2px dashed #CBD5E1', borderRadius: '12px', padding: '40px', textAlign: 'center', marginBottom: '20px' }}>
              <p style={{ fontSize: '32px' }}>⬆</p>
              <p>Click to upload or drag & drop</p>
              <p style={{ fontSize: '12px', color: '#64748B' }}>PDF, JPG, PNG (Max 10MB)</p>
            </div>
            <button onClick={() => { alert('Upload Feature Coming Soon!'); setShowUploadModal(false) }} style={{ width: '100%', backgroundColor: '#16A34A', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '600' }}>Save Document</button>
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

    </div>
  )
}