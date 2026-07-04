import React, { useState, useEffect, useRef } from "react";
import { collection, onSnapshot, doc, setDoc, deleteDoc, query, orderBy, getDocs, where, updateDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { useStore } from "../store/useStore";
import { sendDeviceNotification } from "../utils/notification";
import { AttendanceRecord } from "../types";
import { Calendar, Clock, CheckCircle, XCircle, FileText, Activity, Plus, Edit2, Trash2, X, MapPin } from "lucide-react";
import { toast } from "react-hot-toast";

const CurrencyInput = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
  const displayValue = value ? `Rp${value.toLocaleString('id-ID')}` : '';

  return (
    <input
      type="text"
      value={displayValue}
      placeholder="Rp0"
      onChange={(e) => {
        const val = e.target.value.replace(/\D/g, '');
        onChange(parseInt(val) || 0);
      }}
      className="w-full bg-app-bg border border-app-border rounded px-2 py-1.5 outline-none focus:border-app-accent1 text-xs text-app-text-bright"
    />
  );
};

const FloatInput = ({ value, onChange }: { value: number, onChange: (val: number) => void }) => {
  const [localValue, setLocalValue] = useState(value === 0 ? "" : value.toString());
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (!isFocused) {
      setLocalValue(value === 0 ? "" : value.toString());
    }
  }, [value, isFocused]);

  return (
    <input
      type="number"
      step="0.01"
      placeholder="0"
      value={isFocused ? localValue : (value || '')}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        // Force sync on blur if needed
        let num = parseFloat(localValue);
        if (isNaN(num)) num = 0;
        onChange(num);
      }}
      onChange={(e) => {
        setLocalValue(e.target.value);
        let num = parseFloat(e.target.value);
        if (isNaN(num)) num = 0;
        onChange(num);
      }}
      className="w-16 mx-auto bg-app-bg border border-app-border rounded px-2 py-1.5 outline-none focus:border-app-accent1 text-xs text-center text-app-text-bright"
    />
  );
};

export default function Attendance() {
  const { user, workSchedule, setWorkSchedule, attendancePeriodStart, attendancePeriodEnd, setAttendancePeriodStart, setAttendancePeriodEnd, salarySettings } = useStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [selectedPeriodStart, setSelectedPeriodStart] = useState<Date>(() => {
     const now = new Date();
     if (now.getDate() >= attendancePeriodStart) {
         return new Date(now.getFullYear(), now.getMonth(), attendancePeriodStart);
     } else {
         return new Date(now.getFullYear(), now.getMonth() - 1, attendancePeriodStart);
     }
  });
  
  // Form states
  const [status, setStatus] = useState<'present' | 'absent' | 'leave' | 'sick'>('present');
  const [notes, setNotes] = useState("");
  const [localSalarySettings, setLocalSalarySettings] = useState(salarySettings);
  const pendingUpdatesRef = useRef<Record<string, number>>({});
  const updateTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    setLocalSalarySettings({ ...salarySettings, ...pendingUpdatesRef.current });
  }, [salarySettings]);

  const handleUpdateSalarySettings = (field: string, value: number) => {
    pendingUpdatesRef.current[field] = value;
    const updated = { ...localSalarySettings, ...pendingUpdatesRef.current };
    setLocalSalarySettings(updated);
    
    if (updateTimeoutRef.current) clearTimeout(updateTimeoutRef.current);
    updateTimeoutRef.current = setTimeout(async () => {
      if (!user) return;
      try {
        await updateDoc(doc(db, 'users', user.uid), { salarySettings: updated });
        // After successful save, we can clear the pending updates so that future server updates can take effect
        pendingUpdatesRef.current = {};
      } catch (e) {
        console.error("Failed to update salary settings", e);
      }
    }, 1000);
  };
  
  // Modal states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [selectedDateForHours, setSelectedDateForHours] = useState<Date | null>(null);
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [modalDate, setModalDate] = useState("");
  const [modalStatus, setModalStatus] = useState<'present' | 'absent' | 'leave' | 'sick'>('present');
  const [modalCheckIn, setModalCheckIn] = useState("");
  const [modalCheckOut, setModalCheckOut] = useState("");
  const [modalNotes, setModalNotes] = useState("");

  useEffect(() => {
    if (!user) return;
    
    const startOfPeriod = selectedPeriodStart.getTime();
    
    // determine the end date of this period based on attendancePeriodEnd
    const endOfPeriodDate = new Date(selectedPeriodStart);
    if (attendancePeriodEnd < attendancePeriodStart) {
        endOfPeriodDate.setMonth(endOfPeriodDate.getMonth() + 1);
    }
    // Handle case where end date exceeds days in month (e.g. 31st of Feb)
    const targetMonth = endOfPeriodDate.getMonth();
    endOfPeriodDate.setDate(attendancePeriodEnd);
    if (endOfPeriodDate.getMonth() !== targetMonth) {
       // if we spilled over, go back to last day of target month
       endOfPeriodDate.setDate(0);
    }
    
    endOfPeriodDate.setHours(23, 59, 59, 999);
    
    const endOfPeriod = endOfPeriodDate.getTime();

    const q = query(
      collection(db, "users", user.uid, "attendance"),
      where("date", ">=", startOfPeriod),
      where("date", "<=", endOfPeriod),
      orderBy("date", "desc")
    );
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const recs: AttendanceRecord[] = [];
      snapshot.forEach((doc) => {
        recs.push({ id: doc.id, ...doc.data() } as AttendanceRecord);
      });
      setRecords(recs);
    });

    return () => unsubscribe();
  }, [user, selectedPeriodStart, attendancePeriodStart]);

  const todayRecord = records.find(r => {
    const today = new Date();
    today.setHours(0,0,0,0);
    return r.date === today.getTime();
  });

  const openAddModal = () => {
    const today = new Date();
    // Use local time formatted correctly
    setModalDate(new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    setModalStatus('present');
    setModalCheckIn("");
    setModalCheckOut("");
    setModalNotes("");
    setEditingRecord(null);
    setIsModalOpen(true);
  };

  const openEditModal = (record: AttendanceRecord) => {
    const d = new Date(record.date);
    setModalDate(new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().split('T')[0]);
    setModalStatus(record.status);
    setModalCheckIn(record.checkIn ? new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "");
    setModalCheckOut(record.checkOut ? new Date(record.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : "");
    setModalNotes(record.notes || "");
    setEditingRecord(record);
    setIsModalOpen(true);
  };
  
  const handleSaveModal = async () => {
    if (!user) return;
    try {
      const selectedD = new Date(modalDate);
      selectedD.setHours(0,0,0,0);
      const dateId = selectedD.getTime().toString();
      const docRef = doc(db, "users", user.uid, "attendance", dateId);
      
      const data: any = {
        date: selectedD.getTime(),
        status: modalStatus,
        notes: modalNotes
      };
      
      if (modalStatus === 'present') {
        if (modalCheckIn) {
          const [h,m] = modalCheckIn.split(':');
          const ci = new Date(selectedD);
          ci.setHours(parseInt(h), parseInt(m), 0, 0);
          data.checkIn = ci.getTime();
        } else {
          data.checkIn = null;
        }
        
        if (modalCheckOut) {
          const [h,m] = modalCheckOut.split(':');
          const co = new Date(selectedD);
          co.setHours(parseInt(h), parseInt(m), 0, 0);
          data.checkOut = co.getTime();
        } else {
          data.checkOut = null;
        }
      } else {
         data.checkIn = null;
         data.checkOut = null;
      }
      
      if (editingRecord && editingRecord.id !== dateId) {
         // Delete old record if date changed
         await deleteDoc(doc(db, "users", user.uid, "attendance", editingRecord.id));
      }
      
      await setDoc(docRef, data, { merge: true });

      // Notify device
      let nominal = 0;
      if (modalStatus === 'present' && salarySettings?.gajiPokok) {
        nominal = salarySettings.gajiPokok;
      }
      const actionDesc = modalStatus === 'present' 
        ? `Kehadiran (Check-In: ${modalCheckIn || '-'}, Check-Out: ${modalCheckOut || '-'})`
        : modalStatus === 'absent' ? 'Alpa / Tidak Hadir'
        : modalStatus === 'leave' ? 'Izin / Cuti'
        : modalStatus === 'holiday' ? 'Hari Libur'
        : modalStatus;

      sendDeviceNotification(
        "Pencatatan Absensi Berhasil 📅",
        `Absensi tanggal ${modalDate} berhasil disimpan.\nStatus: ${actionDesc}${nominal > 0 ? `\nGaji Pokok Harian: Rp ${nominal.toLocaleString("id-ID")}` : ""}`
      );

      toast.success("Data berhasil disimpan");
      setIsModalOpen(false);
    } catch (e) {
      toast.error("Gagal menyimpan data");
    }
  };

  const handleDelete = async (record: AttendanceRecord) => {
     if (!user) return;
     if (!confirm("Hapus data absensi ini?")) return;
     try {
       await deleteDoc(doc(db, "users", user.uid, "attendance", record.id));
       toast.success("Data dihapus");
     } catch (e) {
       toast.error("Gagal menghapus data");
     }
  };

  const handleAction = async (action: 'checkIn' | 'checkOut') => {
    if (!user) return;
    
    let location: { lat: number; lng: number } | null = null;
    try {
      if (navigator.geolocation) {
        const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            enableHighAccuracy: true,
            timeout: 10000,
          });
        });
        location = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
      }
    } catch (e) {
      console.warn("Could not get location", e);
      toast.error("Tidak dapat merekam lokasi.");
    }

    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const dateId = today.getTime().toString();
      
      const docRef = doc(db, "users", user.uid, "attendance", dateId);
      
      if (action === 'checkIn') {
        const data: any = {
          date: today.getTime(),
          status,
          notes,
          checkIn: Date.now()
        };
        if (location) data.checkInLocation = location;
        await setDoc(docRef, data, { merge: true });

        // Notify device
        const nominal = salarySettings?.gajiPokok || 0;
        sendDeviceNotification(
          "Berhasil Check In 🕰️",
          `Check-In berhasil dicatat pada ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}.${nominal > 0 ? `\nGaji Pokok Harian: Rp ${nominal.toLocaleString("id-ID")}` : ""}`
        );

        toast.success("Berhasil Check In");
      } else if (action === 'checkOut') {
         const data: any = { checkOut: Date.now() };
         if (location) data.checkOutLocation = location;
         await setDoc(docRef, data, { merge: true });

         // Notify device
         sendDeviceNotification(
           "Berhasil Check Out 🚪",
           `Check-Out berhasil dicatat pada ${new Date().toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" })}.`
         );

         toast.success("Berhasil Check Out");
      }
      setNotes("");
    } catch (err) {
      console.error(err);
      toast.error(`Gagal ${action === 'checkIn' ? 'Check In' : 'Check Out'}`);
    }
  };

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'present': return 'text-app-success bg-app-success/10 border-app-success/20';
      case 'absent': return 'text-app-danger bg-app-danger/10 border-app-danger/20';
      case 'leave': return 'text-app-warning bg-app-warning/10 border-app-warning/20';
      case 'sick': return 'text-app-accent1 bg-app-accent1/10 border-app-accent1/20';
      default: return 'text-app-text-bright bg-app-bg border-app-border';
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'present': return 'Hadir';
      case 'absent': return 'Alpa';
      case 'leave': return 'Izin';
      case 'sick': return 'Sakit';
      default: return '-';
    }
  };

  const getStatusIcon = (s: string) => {
    switch (s) {
      case 'present': return <CheckCircle className="w-4 h-4" />;
      case 'absent': return <XCircle className="w-4 h-4" />;
      case 'leave': return <FileText className="w-4 h-4" />;
      case 'sick': return <Activity className="w-4 h-4" />;
      default: return <Clock className="w-4 h-4" />;
    }
  };

  const todayDay = new Date().getDay().toString();
  const todaySchedule = workSchedule?.days[todayDay];

  return (
    <div className="flex-1 flex flex-col w-full h-full max-w-7xl mx-auto p-4 md:p-8 pb-32 md:pb-8 overflow-y-auto bg-app-bg text-app-text">
      <header className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-app-text-bright mb-1 tracking-tight">
            Absensi
          </h1>
          <p className="text-app-text/70 text-sm">
            Catat dan pantau kehadiran Anda
          </p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          <button 
            onClick={() => setIsScheduleModalOpen(true)} 
            className="flex items-center justify-center gap-2 px-4 py-2 bg-app-card border border-app-border rounded-xl text-sm font-medium text-app-text-bright hover:bg-app-hover transition-colors"
          >
            <Calendar className="w-4 h-4" />
            Pengaturan Jadwal
          </button>
        </div>
      </header>

      <div className="space-y-6 md:space-y-8">

        {/* Today's Actions */}
        <div className="bg-app-card rounded-2xl border border-app-border p-5 shadow-sm relative overflow-hidden group hover:border-app-accent1/30 transition-colors">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-app-accent1/15 via-transparent to-transparent pointer-events-none opacity-80 block" />
          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-2">
              <h2 className="font-bold text-app-text-bright flex items-center gap-2">
                <Calendar className="w-5 h-5 text-app-accent1" />
                Absen Hari Ini - {new Date().toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </h2>
              {todaySchedule && (
                <div className="text-xs font-medium px-3 py-1.5 rounded-full border bg-app-bg border-app-border text-app-text-bright">
                  {todaySchedule.isActive ? `Jadwal: ${todaySchedule.start} - ${todaySchedule.end}` : 'Hari Libur'}
                </div>
              )}
            </div>

            {todayRecord ? (
              <div className="bg-app-bg p-4 rounded-xl border border-app-border flex flex-col items-center justify-center gap-4 py-8">
                 <div className="flex gap-4 w-full justify-center">
                    <div className="text-center bg-app-card border border-app-border rounded-xl p-4 min-w-[120px] shadow-sm flex flex-col items-center">
                      <p className="text-xs text-app-text/60 mb-1 font-medium">Check In</p>
                      <div className="flex items-center gap-1.5 justify-center">
                        <p className="font-bold text-app-text-bright text-xl">{todayRecord.checkIn ? new Date(todayRecord.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}) : '-'}</p>
                        {todayRecord.checkInLocation && (
                          <a href={`https://maps.google.com/?q=${todayRecord.checkInLocation.lat},${todayRecord.checkInLocation.lng}`} target="_blank" rel="noreferrer" className="text-app-accent1 hover:opacity-80">
                            <MapPin className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="text-center bg-app-card border border-app-border rounded-xl p-4 min-w-[120px] shadow-sm flex flex-col items-center">
                      <p className="text-xs text-app-text/60 mb-1 font-medium">Check Out</p>
                      <div className="flex items-center gap-1.5 justify-center">
                        <p className="font-bold text-app-text-bright text-xl">{todayRecord.checkOut ? new Date(todayRecord.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit'}) : '-'}</p>
                        {todayRecord.checkOutLocation && (
                          <a href={`https://maps.google.com/?q=${todayRecord.checkOutLocation.lat},${todayRecord.checkOutLocation.lng}`} target="_blank" rel="noreferrer" className="text-app-accent1 hover:opacity-80">
                            <MapPin className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </div>
                 </div>
                 
                 {todayRecord.status === 'present' && !todayRecord.checkOut && (
                    <div className="w-full max-w-sm mt-4">
                       {todayRecord.checkIn && (Date.now() - todayRecord.checkIn > 3 * 60 * 60 * 1000) ? (
                          <button
                            onClick={() => handleAction('checkOut')}
                            className="w-full py-4 bg-app-danger text-app-bg rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                          >
                            <Clock className="w-5 h-5" />
                            Absen Keluar
                          </button>
                       ) : (
                          <div className="text-center p-4 bg-app-warning/10 border border-app-warning/20 rounded-xl text-app-warning text-sm font-medium">
                            Anda sudah Check In. Tombol Check Out akan muncul setelah 3 jam.
                          </div>
                       )}
                    </div>
                 )}
                 
                 {todayRecord.notes && (
                   <p className="text-sm text-app-text/70 mt-2 bg-app-card px-4 py-2 rounded-lg border border-app-border/50">Catatan: {todayRecord.notes}</p>
                 )}
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <label className="block text-xs font-bold text-app-text/70 mb-3 uppercase tracking-wider">
                    Status Kehadiran Hari Ini
                  </label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {(['present', 'absent', 'leave', 'sick'] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => setStatus(s)}
                        className={`flex flex-col items-center justify-center gap-2 py-4 rounded-xl border transition-all ${
                          status === s ? getStatusColor(s) : 'bg-app-bg border-app-border text-app-text/60 hover:bg-app-hover'
                        }`}
                      >
                        {getStatusIcon(s)}
                        <span className="text-xs font-bold">{getStatusLabel(s)}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">
                    Catatan (Opsional)
                  </label>
                  <input
                    type="text"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Contoh: Terlambat karena macet"
                    className="w-full bg-app-bg border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-4 outline-none focus:border-app-accent1"
                  />
                </div>

                <button
                  onClick={() => handleAction('checkIn')}
                  className="w-full py-4 bg-app-accent1 text-app-bg rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
                >
                  <Clock className="w-5 h-5" />
                  {status === 'present' ? 'Absen Masuk Sekarang' : `Simpan Status ${getStatusLabel(status)}`}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* History */}
        <div>
           <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
             <div className="flex items-center gap-4">
               <h2 className="font-bold text-app-text-bright">Riwayat Kehadiran</h2>
               <button onClick={openAddModal} className="flex items-center gap-1.5 px-3 py-1.5 bg-app-accent1/10 text-app-accent1 rounded-lg hover:bg-app-accent1/20 transition-colors text-xs font-bold">
                  <Plus className="w-3.5 h-3.5" />
                  Manual
               </button>
             </div>
             <div className="hidden md:flex items-center gap-2">
               <button 
                 onClick={() => setSelectedPeriodStart(new Date(selectedPeriodStart.getFullYear(), selectedPeriodStart.getMonth() - 1, attendancePeriodStart))}
                 className="p-1 text-app-text/50 hover:text-app-text-bright transition-colors bg-app-card rounded-md border border-app-border"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
               </button>
               <span className="text-xs font-medium text-app-text-bright bg-app-card px-3 py-1.5 rounded-lg border border-app-border">
                 {(() => {
                   const end = new Date(selectedPeriodStart);
                   if (attendancePeriodEnd < attendancePeriodStart) {
                       end.setMonth(end.getMonth() + 1);
                   }
                   const targetMonth = end.getMonth();
                   end.setDate(attendancePeriodEnd);
                   if (end.getMonth() !== targetMonth) {
                      end.setDate(0);
                   }
                   const startStr = selectedPeriodStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                   const endStr = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                   return `${startStr} - ${endStr}`;
                 })()}
               </span>
               <button 
                 onClick={() => setSelectedPeriodStart(new Date(selectedPeriodStart.getFullYear(), selectedPeriodStart.getMonth() + 1, attendancePeriodStart))}
                 className="p-1 text-app-text/50 hover:text-app-text-bright transition-colors bg-app-card rounded-md border border-app-border"
               >
                 <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
               </button>
             </div>
           </div>

           <div className="space-y-3">
             {records.length > 0 ? records.map(record => (
               <div key={record.id} className="bg-app-card rounded-xl border border-app-border p-4 flex items-center justify-between">
                 <div className="flex items-center gap-4">
                   <div className="w-12 h-12 rounded-lg bg-app-bg border border-app-border flex flex-col items-center justify-center shrink-0">
                     <span className="text-xs text-app-text/70">{new Date(record.date).toLocaleDateString('id-ID', { weekday: 'short' })}</span>
                     <span className="text-lg font-bold text-app-text-bright leading-none">{new Date(record.date).getDate()}</span>
                   </div>
                   <div>
                     <div className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-1 border ${getStatusColor(record.status)}`}>
                        {getStatusIcon(record.status)}
                        {getStatusLabel(record.status)}
                     </div>
                     {record.notes && <p className="text-xs text-app-text/60 line-clamp-1">{record.notes}</p>}
                   </div>
                 </div>
                 <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end mt-4 md:mt-0">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEditModal(record)} className="p-2 text-app-text/50 hover:text-app-accent1 bg-app-bg rounded-md border border-app-border transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(record)} className="p-2 text-app-text/50 hover:text-app-danger bg-app-bg rounded-md border border-app-border transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="text-right flex flex-col gap-1">
                   {record.checkIn && (
                     <div className="flex items-center justify-end gap-1.5 text-xs">
                       <span className="text-app-text/50">Masuk:</span>
                       <span className="font-medium text-app-text-bright">{new Date(record.checkIn).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                       {record.checkInLocation && (
                         <a href={`https://maps.google.com/?q=${record.checkInLocation.lat},${record.checkInLocation.lng}`} target="_blank" rel="noreferrer" className="text-app-accent1 hover:opacity-80">
                           <MapPin className="w-3 h-3" />
                         </a>
                       )}
                     </div>
                   )}
                   {record.checkOut && (
                     <div className="flex items-center justify-end gap-1.5 text-xs">
                       <span className="text-app-text/50">Keluar:</span>
                       <span className="font-medium text-app-text-bright">{new Date(record.checkOut).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}</span>
                       {record.checkOutLocation && (
                         <a href={`https://maps.google.com/?q=${record.checkOutLocation.lat},${record.checkOutLocation.lng}`} target="_blank" rel="noreferrer" className="text-app-accent1 hover:opacity-80">
                           <MapPin className="w-3 h-3" />
                         </a>
                       )}
                     </div>
                   )}
                 </div>
                 </div>
               </div>
             )) : (
               <div className="bg-app-card rounded-xl border border-app-border p-8 text-center text-app-text/50">
                 Belum ada data absensi bulan ini.
               </div>
             )}
           </div>
        </div>


      </div>

      {isScheduleModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-app-bg w-full max-w-3xl rounded-3xl border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <h2 className="font-bold text-app-text-bright">Pengaturan Jadwal & Periode</h2>
              <button onClick={() => setIsScheduleModalOpen(false)} className="p-2 text-app-text/50 hover:text-app-text-bright transition-colors rounded-full hover:bg-app-card">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              
              <div className="bg-app-card p-4 rounded-2xl border border-app-border">
                <h3 className="font-bold text-app-text-bright mb-4 text-sm flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-app-accent1" />
                  Pengaturan Periode Absensi
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">Tgl Awal</label>
                    <input 
                      type="number" min="1" max="31" 
                      value={attendancePeriodStart} 
                      onChange={async (e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 1;
                        if (val < 1) val = 1;
                        if (val > 31) val = 31;
                        setAttendancePeriodStart(val);
                        if (user) await updateDoc(doc(db, 'users', user.uid), { attendancePeriodStart: val });
                      }} 
                      className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright" 
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase font-bold tracking-wider mb-2 block text-app-text/70">Tgl Akhir</label>
                    <input 
                      type="number" min="1" max="31" 
                      value={attendancePeriodEnd} 
                      onChange={async (e) => {
                        let val = parseInt(e.target.value);
                        if (isNaN(val)) val = 1;
                        if (val < 1) val = 1;
                        if (val > 31) val = 31;
                        setAttendancePeriodEnd(val);
                        if (user) await updateDoc(doc(db, 'users', user.uid), { attendancePeriodEnd: val });
                      }} 
                      className="w-full bg-app-bg border border-app-border rounded-lg px-3 py-3 text-sm focus:border-app-accent1 outline-none text-app-text-bright" 
                    />
                  </div>
                </div>
                <p className="text-xs text-app-text/50 mt-3">Perubahan periode akan langsung tersimpan. Contoh: Awal 19, Akhir 18.</p>
              </div>

              <div className="bg-app-card p-4 rounded-2xl border border-app-border">
                 <div className="flex items-center justify-between mb-4">
                   <h3 className="font-bold text-app-text-bright text-sm">Pratinjau Kalender Periode Ini</h3>
                   <div className="flex items-center gap-2">
                     <button 
                       onClick={() => setSelectedPeriodStart(new Date(selectedPeriodStart.getFullYear(), selectedPeriodStart.getMonth() - 1, attendancePeriodStart))}
                       className="p-1 text-app-text/50 hover:text-app-text-bright transition-colors bg-app-bg rounded-md border border-app-border"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                     </button>
                     <span className="text-xs font-medium text-app-text-bright bg-app-bg px-2 py-1 rounded border border-app-border">
                       {(() => {
                         const end = new Date(selectedPeriodStart);
                         if (attendancePeriodEnd < attendancePeriodStart) {
                             end.setMonth(end.getMonth() + 1);
                         }
                         const targetMonth = end.getMonth();
                         end.setDate(attendancePeriodEnd);
                         if (end.getMonth() !== targetMonth) {
                            end.setDate(0);
                         }
                         const startStr = selectedPeriodStart.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
                         const endStr = end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
                         return `${startStr} - ${endStr}`;
                       })()}
                     </span>
                     <button 
                       onClick={() => setSelectedPeriodStart(new Date(selectedPeriodStart.getFullYear(), selectedPeriodStart.getMonth() + 1, attendancePeriodStart))}
                       className="p-1 text-app-text/50 hover:text-app-text-bright transition-colors bg-app-bg rounded-md border border-app-border"
                     >
                       <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                     </button>
                   </div>
                 </div>
                 <div className="grid grid-cols-7 gap-1 text-center mb-2">
                   {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(d => (
                     <div key={d} className="text-[10px] font-bold text-app-text/50 uppercase py-1">{d}</div>
                   ))}
                 </div>
                 <div className="grid grid-cols-7 gap-1">
                   {(() => {
                      const startOfPeriod = new Date(selectedPeriodStart);
                      
                      const endOfPeriodDate = new Date(selectedPeriodStart);
                      if (attendancePeriodEnd < attendancePeriodStart) {
                          endOfPeriodDate.setMonth(endOfPeriodDate.getMonth() + 1);
                      }
                      const targetMonth = endOfPeriodDate.getMonth();
                      endOfPeriodDate.setDate(attendancePeriodEnd);
                      if (endOfPeriodDate.getMonth() !== targetMonth) {
                         endOfPeriodDate.setDate(0);
                      }
                      
                      const startDay = startOfPeriod.getDay();
                      
                      const daysCount = Math.round((endOfPeriodDate.getTime() - startOfPeriod.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                      
                      const blanks = Array(startDay).fill(null);
                      const days = Array.from({length: daysCount}, (_, i) => {
                         const d = new Date(startOfPeriod);
                         d.setDate(d.getDate() + i);
                         return d;
                      });
                      
                      const today = new Date();
                      
                      return [...blanks, ...days].map((d, i) => {
                        if (!d) return <div key={`blank-${i}`} />;
                        
                        const isToday = d.getDate() === today.getDate() && d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear();
                        
                        // Check if there is an attendance record for this day
                        const dStart = new Date(d);
                        dStart.setHours(0,0,0,0);
                        const dEnd = new Date(d);
                        dEnd.setHours(23,59,59,999);
                        const hasRecord = records.find(r => r.date >= dStart.getTime() && r.date <= dEnd.getTime());
                        
                        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        const dayId = d.getDay().toString();
                        const defaultSchedule = workSchedule?.days?.[dayId] || { isActive: true, start: '08:00', end: '17:00' };
                        const currentSchedule = workSchedule?.overrides?.[dateStr] || defaultSchedule;
                        
                        return (
                          <div 
                            key={i} 
                            onClick={() => setSelectedDateForHours(d)}
                            className={`p-1.5 min-h-[4rem] flex flex-row items-start justify-between rounded-lg relative cursor-pointer hover:bg-app-card transition-colors border ${isToday ? 'bg-app-accent1/10 border-app-accent1 text-app-accent1' : 'bg-app-bg border-app-border text-app-text-bright'}`}
                          >
                             <span className="text-xl font-bold pl-0.5">{d.getDate()}</span>
                             <div className="flex flex-col items-end text-right pr-0.5 mt-0.5">
                               {hasRecord ? (
                                 hasRecord.status === 'present' ? (
                                   <div className="text-xs text-app-success leading-tight flex flex-col font-bold gap-0.5">
                                     <span>{hasRecord.checkIn ? new Date(hasRecord.checkIn).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</span>
                                     <span>{hasRecord.checkOut ? new Date(hasRecord.checkOut).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'}) : '-'}</span>
                                     {(() => {
                                        if (hasRecord.checkIn && hasRecord.checkOut) {
                                            const [sH, sM] = currentSchedule.start.split(':').map(Number);
                                            const [eH, eM] = currentSchedule.end.split(':').map(Number);
                                            const schedHours = currentSchedule.isActive ? (eH + eM/60) - (sH + sM/60) : 0;
                                            const actualHours = (hasRecord.checkOut - hasRecord.checkIn) / 3600000;
                                            const diff = actualHours - schedHours;
                                            if (diff >= 0.5) {
                                                return <span className="text-[10px] text-app-warning mt-1 bg-app-warning/10 px-1 py-0.5 rounded block">+{diff.toFixed(5).replace('.', ',')}j</span>;
                                            }
                                        }
                                        return null;
                                     })()}
                                   </div>
                                 ) : (
                                   <div className={`text-xs mt-1 leading-tight font-black ${hasRecord.status === 'leave' ? 'text-app-warning' : hasRecord.status === 'sick' ? 'text-app-accent1' : 'text-app-danger'}`}>
                                     {hasRecord.status === 'leave' ? 'IZIN' : hasRecord.status === 'sick' ? 'SAKIT' : 'ALPHA'}
                                   </div>
                                 )
                               ) : currentSchedule.isActive ? (
                                 <div className="text-xs text-app-text/40 leading-tight flex flex-col font-medium">
                                   <span>{currentSchedule.start}</span>
                                   <span>{currentSchedule.end}</span>
                                 </div>
                               ) : (
                                 <div className="text-xs text-app-danger/50 leading-tight font-bold mt-1">Libur</div>
                               )}
                             </div>
                             {hasRecord && <div className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 left-1.5 ${hasRecord.status === 'present' ? 'bg-app-success' : hasRecord.status === 'absent' ? 'bg-app-danger' : hasRecord.status === 'leave' ? 'bg-app-warning' : 'bg-app-accent1'}`} />}
                          </div>
                        );
                      });
                   })()}
                 </div>
              </div>

               {/* Salary Calculation */}
               <div className="bg-app-card p-4 rounded-2xl border border-app-border overflow-x-auto shadow-sm">
                  <h3 className="font-bold text-app-text-bright mb-4 text-sm flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-app-accent1" />
                    Perhitungan Gaji
                  </h3>
                  {(() => {
                    const hariMasuk = records.filter(r => r.status === 'present').length;
                    const tidakMasuk = records.filter(r => r.status !== 'present').length;
                    const s = localSalarySettings || { gajiPokok: 0, uangHarian: 0, uangKerajinan: 0, uangMakan: 0, uangTunjangan: 0, uangLemburPerJam: 0, lemburHours: 0 };
                    
                    let autoLembur = 0;
                    
                    const startOfPeriod = new Date(selectedPeriodStart);
                    const endOfPeriodDate = new Date(selectedPeriodStart);
                    if (attendancePeriodEnd < attendancePeriodStart) {
                        endOfPeriodDate.setMonth(endOfPeriodDate.getMonth() + 1);
                    }
                    const targetMonth = endOfPeriodDate.getMonth();
                    endOfPeriodDate.setDate(attendancePeriodEnd);
                    if (endOfPeriodDate.getMonth() !== targetMonth) {
                       endOfPeriodDate.setDate(0);
                    }
                    const daysCount = Math.round((endOfPeriodDate.getTime() - startOfPeriod.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    const days = Array.from({length: daysCount}, (_, i) => {
                       const d = new Date(startOfPeriod);
                       d.setDate(d.getDate() + i);
                       return d;
                    });
                    
                    let hariKerjaSeharusnya = 0;
                    days.forEach(d => {
                        const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                        const dayId = d.getDay().toString();
                        const defaultSchedule = workSchedule?.days?.[dayId] || { isActive: true, start: '08:00', end: '17:00' };
                        const currentSchedule = workSchedule?.overrides?.[dateStr] || defaultSchedule;
                        if (currentSchedule.isActive) {
                            hariKerjaSeharusnya++;
                        }
                    });

                    records.forEach(r => {
                        if (r.status === 'present' && r.checkIn && r.checkOut) {
                            const d = new Date(r.date);
                            const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
                            const dayId = d.getDay().toString();
                            const defaultSchedule = workSchedule?.days?.[dayId] || { isActive: true, start: '08:00', end: '17:00' };
                            const currentSchedule = workSchedule?.overrides?.[dateStr] || defaultSchedule;
                            
                            const [sH, sM] = currentSchedule.start.split(':').map(Number);
                            const [eH, eM] = currentSchedule.end.split(':').map(Number);
                            const schedHours = currentSchedule.isActive ? (eH + eM/60) - (sH + sM/60) : 0;
                            const actualHours = (r.checkOut - r.checkIn) / 3600000;
                            const diff = actualHours - schedHours;
                            if (diff >= 0.5) {
                                autoLembur += diff;
                            }
                        }
                    });
                    
                    const finalLemburHours = s.lemburHours || autoLembur;

                    const totalGajiPokok = s.gajiPokok || 0;
                    const totalUangHarian = (s.uangHarian || 0) * hariMasuk;
                    const totalUangKerajinan = s.uangKerajinan || 0;
                    const totalUangMakan = (s.uangMakan || 0) * hariMasuk;
                    const totalUangTunjangan = s.uangTunjangan || 0;
                    const totalLembur = (s.uangLemburPerJam || 0) * finalLemburHours;
                    
                    const total = totalGajiPokok + totalUangHarian + totalUangKerajinan + totalUangMakan + totalUangTunjangan + totalLembur;
                    
                    const formatRp = (num: number) => `Rp${num.toLocaleString('id-ID')}`;
                    
                    return (
                      <table className="w-full text-left border-collapse text-sm min-w-[500px]">
                        <thead>
                          <tr className="border-b border-app-border text-app-text/70 uppercase text-[10px] tracking-wider">
                            <th className="py-2 font-bold w-1/3">Komponen</th>
                            <th className="py-2 font-bold w-1/4">Nilai Dasar</th>
                            <th className="py-2 font-bold w-1/6 text-center">Faktor</th>
                            <th className="py-2 font-bold text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-app-border/50">
                          <tr>
                            <td className="py-3 font-medium text-app-text-bright">Gaji Pokok</td>
                            <td className="py-2">
                              <CurrencyInput value={s.gajiPokok || 0} onChange={(val) => handleUpdateSalarySettings('gajiPokok', val)} />
                            </td>
                            <td className="py-2 text-center text-app-text/50">-</td>
                            <td className="py-2 text-right font-bold text-app-text-bright">{formatRp(totalGajiPokok)}</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-medium text-app-text-bright">Uang Harian</td>
                            <td className="py-2">
                              <CurrencyInput value={s.uangHarian || 0} onChange={(val) => handleUpdateSalarySettings('uangHarian', val)} />
                            </td>
                            <td className="py-2 text-center text-app-text-bright font-bold">{hariMasuk}</td>
                            <td className="py-2 text-right font-bold text-app-text-bright">{formatRp(totalUangHarian)}</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-medium text-app-text-bright">Uang Kerajinan</td>
                            <td className="py-2">
                              <CurrencyInput value={s.uangKerajinan || 0} onChange={(val) => handleUpdateSalarySettings('uangKerajinan', val)} />
                            </td>
                            <td className="py-2 text-center text-app-text/50">-</td>
                            <td className="py-2 text-right font-bold text-app-text-bright">{formatRp(totalUangKerajinan)}</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-medium text-app-text-bright">Uang Makan</td>
                            <td className="py-2">
                              <CurrencyInput value={s.uangMakan || 0} onChange={(val) => handleUpdateSalarySettings('uangMakan', val)} />
                            </td>
                            <td className="py-2 text-center text-app-text-bright font-bold">{hariMasuk}</td>
                            <td className="py-2 text-right font-bold text-app-text-bright">{formatRp(totalUangMakan)}</td>
                          </tr>
                          <tr>
                            <td className="py-3 font-medium text-app-text-bright">Uang Tunjangan</td>
                            <td className="py-2">
                              <CurrencyInput value={s.uangTunjangan || 0} onChange={(val) => handleUpdateSalarySettings('uangTunjangan', val)} />
                            </td>
                            <td className="py-2 text-center text-app-text/50">-</td>
                            <td className="py-2 text-right font-bold text-app-text-bright">{formatRp(totalUangTunjangan)}</td>
                          </tr>
                          <tr className="bg-app-accent1/5">
                            <td className="py-3 font-medium text-app-accent1 pl-2">Hari Masuk Reguler</td>
                            <td className="py-2"></td>
                            <td className="py-2 text-center text-app-accent1 font-bold">{hariKerjaSeharusnya}</td>
                            <td className="py-2 text-right"></td>
                          </tr>
                          <tr className="bg-app-danger/5">
                            <td className="py-3 font-medium text-app-danger pl-2">Tidak Masuk (Sakit, Izin, Alpha)</td>
                            <td className="py-2"></td>
                            <td className="py-2 text-center text-app-danger font-bold">{tidakMasuk}</td>
                            <td className="py-2 text-right"></td>
                          </tr>
                          <tr>
                            <td className="py-3 font-medium text-app-text-bright">Lembur</td>
                            <td className="py-2">
                              <CurrencyInput value={s.uangLemburPerJam || 0} onChange={(val) => handleUpdateSalarySettings('uangLemburPerJam', val)} />
                            </td>
                            <td className="py-2 text-center relative group">
                              <FloatInput value={finalLemburHours} onChange={(val) => handleUpdateSalarySettings('lemburHours', val)} />
                              <div className="absolute left-1/2 -translate-x-1/2 bottom-full mb-2 bg-app-card border border-app-border text-[10px] p-2 rounded shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-10 transition-opacity">
                                <div>Otomatis: {autoLembur.toLocaleString('id-ID', {maximumFractionDigits:5})}j</div>
                                <div className="text-app-text/50">Ketik manual untuk menimpa</div>
                              </div>
                            </td>
                            <td className="py-2 text-right font-bold text-app-text-bright">{formatRp(totalLembur)}</td>
                          </tr>
                          <tr className="border-t-2 border-app-border">
                            <td className="py-4 font-bold text-app-text-bright text-base" colSpan={3}>Total</td>
                            <td className="py-4 text-right font-bold text-app-warning text-base"><span className="bg-app-warning/10 px-3 py-1.5 rounded-lg">{formatRp(total)}</span></td>
                          </tr>
                        </tbody>
                      </table>
                    );
                  })()}
               </div>

            </div>
          </div>
        </div>
      )}

      {selectedDateForHours && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-app-bg w-full max-w-sm rounded-3xl border border-app-border shadow-2xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <h2 className="font-bold text-app-text-bright">Jam Kerja ({selectedDateForHours.toLocaleDateString('id-ID')})</h2>
              <button onClick={() => setSelectedDateForHours(null)} className="p-2 text-app-text/50 hover:text-app-text-bright transition-colors rounded-full hover:bg-app-card">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4">
              {(() => {
                 const dateStr = `${selectedDateForHours.getFullYear()}-${String(selectedDateForHours.getMonth()+1).padStart(2,'0')}-${String(selectedDateForHours.getDate()).padStart(2,'0')}`;
                 const dayId = selectedDateForHours.getDay().toString();
                 const defaultSchedule = workSchedule?.days?.[dayId] || { isActive: true, start: '08:00', end: '17:00' };
                 const override = workSchedule?.overrides?.[dateStr];
                 const currentSchedule = override || defaultSchedule;
                 
                 return (
                    <div className="space-y-4">
                      <label className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={currentSchedule.isActive}
                          onChange={async (e) => {
                             const newSchedule = { ...workSchedule };
                             if (!newSchedule.overrides) newSchedule.overrides = {};
                             newSchedule.overrides[dateStr] = {
                               ...(currentSchedule),
                               isActive: e.target.checked
                             };
                             setWorkSchedule(newSchedule);
                             if (user) await updateDoc(doc(db, 'users', user.uid), { workSchedule: newSchedule });
                          }}
                          className="w-4 h-4 rounded border-app-border bg-app-bg accent-app-accent1 cursor-pointer"
                        />
                        <span className="text-sm font-medium text-app-text-bright">Hari Kerja</span>
                      </label>
                      
                      <div className={`flex flex-col gap-2 ${!currentSchedule.isActive ? 'opacity-50 pointer-events-none' : ''}`}>
                        <div className="flex items-center justify-between bg-app-card border border-app-border rounded-xl p-3">
                          <span className="text-xs font-medium text-app-text/70 uppercase">Jam Masuk</span>
                          <input
                            type="time"
                            value={currentSchedule.start}
                            onChange={async (e) => {
                               const newSchedule = { ...workSchedule };
                               if (!newSchedule.overrides) newSchedule.overrides = {};
                               newSchedule.overrides[dateStr] = {
                                 ...(currentSchedule),
                                 start: e.target.value
                               };
                               setWorkSchedule(newSchedule);
                               if (user) await updateDoc(doc(db, 'users', user.uid), { workSchedule: newSchedule });
                            }}
                            className="bg-app-bg border border-app-border rounded p-1.5 text-sm text-app-text-bright outline-none focus:border-app-accent1 cursor-pointer"
                          />
                        </div>
                        <div className="flex items-center justify-between bg-app-card border border-app-border rounded-xl p-3">
                          <span className="text-xs font-medium text-app-text/70 uppercase">Jam Keluar</span>
                          <input
                            type="time"
                            value={currentSchedule.end}
                            onChange={async (e) => {
                               const newSchedule = { ...workSchedule };
                               if (!newSchedule.overrides) newSchedule.overrides = {};
                               newSchedule.overrides[dateStr] = {
                                 ...(currentSchedule),
                                 end: e.target.value
                               };
                               setWorkSchedule(newSchedule);
                               if (user) await updateDoc(doc(db, 'users', user.uid), { workSchedule: newSchedule });
                            }}
                            className="bg-app-bg border border-app-border rounded p-1.5 text-sm text-app-text-bright outline-none focus:border-app-accent1 cursor-pointer"
                          />
                        </div>
                      </div>
                      
                      {override && (
                         <button 
                           onClick={async () => {
                             const newSchedule = { ...workSchedule };
                             if (newSchedule.overrides) {
                               delete newSchedule.overrides[dateStr];
                             }
                             setWorkSchedule(newSchedule);
                             if (user) await updateDoc(doc(db, 'users', user.uid), { workSchedule: newSchedule });
                           }}
                           className="text-xs text-app-accent1 underline text-center w-full block mt-2"
                         >
                           Kembalikan ke jadwal bawaan
                         </button>
                      )}
                    </div>
                 );
              })()}
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-app-bg w-full max-w-md rounded-3xl border border-app-border shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between p-4 border-b border-app-border">
              <h2 className="font-bold text-app-text-bright">{editingRecord ? 'Edit Absensi' : 'Tambah Absensi Manual'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 text-app-text/50 hover:text-app-text-bright transition-colors rounded-full hover:bg-app-card">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div>
                <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">Tanggal</label>
                <input
                  type="date"
                  value={modalDate}
                  onChange={(e) => setModalDate(e.target.value)}
                  className="w-full bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                />
              </div>
              
              <div>
                <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">Status Kehadiran</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['present', 'absent', 'leave', 'sick'] as const).map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setModalStatus(s)}
                      className={`flex flex-col items-center justify-center gap-1.5 py-3 rounded-xl border transition-all ${
                        modalStatus === s ? getStatusColor(s) : 'bg-app-bg border-app-border text-app-text/60 hover:bg-app-hover'
                      }`}
                    >
                      {getStatusIcon(s)}
                      <span className="text-[10px] font-bold">{getStatusLabel(s)}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              {modalStatus === 'present' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">Jam Masuk</label>
                    <input
                      type="time"
                      value={modalCheckIn}
                      onChange={(e) => setModalCheckIn(e.target.value)}
                      className="w-full bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">Jam Keluar</label>
                    <input
                      type="time"
                      value={modalCheckOut}
                      onChange={(e) => setModalCheckOut(e.target.value)}
                      className="w-full bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                    />
                  </div>
                </div>
              )}
              
              <div>
                <label className="block text-xs font-bold text-app-text/70 mb-2 uppercase tracking-wider">Catatan (Opsional)</label>
                <input
                  type="text"
                  value={modalNotes}
                  onChange={(e) => setModalNotes(e.target.value)}
                  placeholder="Contoh: Terlambat karena macet"
                  className="w-full bg-app-card border border-app-border text-app-text-bright text-sm rounded-xl px-4 py-3 outline-none focus:border-app-accent1"
                />
              </div>
            </div>
            
            <div className="p-4 border-t border-app-border bg-app-card">
              <button
                onClick={handleSaveModal}
                className="w-full py-3.5 bg-app-accent1 text-app-bg rounded-xl font-bold text-sm hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Simpan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
