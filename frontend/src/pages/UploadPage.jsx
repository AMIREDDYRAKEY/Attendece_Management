import { useState, useRef } from 'react';
import api from '../services/api';
import {
  Upload, FileSpreadsheet, X, Loader2, CheckCircle2, XCircle,
  AlertTriangle, MessageCircle, Users, Download, Info
} from 'lucide-react';
import toast from 'react-hot-toast';

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [dragging, setDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef();

  const handleFile = (f) => {
    if (!f) return;
    const allowed = ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet','application/vnd.ms-excel'];
    if (!allowed.includes(f.type) && !f.name.match(/\.(xlsx|xls)$/i)) { toast.error('Only .xlsx and .xls files allowed'); return; }
    setFile(f); setResult(null);
  };

  const handleUpload = async () => {
    if (!file) { toast.error('Select a file first'); return; }
    setUploading(true);
    const fd = new FormData(); fd.append('file', file);
    try {
      const { data } = await api.post('/attendance/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      setResult(data);
      if (data.success) toast.success(`Processed ${data.totalStudents} students — ${data.whatsappSent} WhatsApp(s) sent!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Upload failed';
      toast.error(msg); setResult(err.response?.data || { success: false, message: msg });
    } finally { setUploading(false); }
  };

  const downloadSample = () => {
    const csv = `Student ID,Student Name,Class,Date,Status\nSTU001,Rahul Kumar,CSE-A,27-09-2026,Present\nSTU002,Ravi Kumar,CSE-A,27-09-2026,Absent\nSTU003,Kiran Kumar,CSE-A,27-09-2026,Present`;
    const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(new Blob([csv],{type:'text/csv'})), download: 'attendance_sample.csv' });
    a.click(); toast.success('Sample downloaded!');
  };

  const statusBadge = (s) => ({
    SENT:         <span className="badge-sent">✓ Sent</span>,
    FAILED:       <span className="badge-failed">✗ Failed</span>,
    SKIPPED:      <span className="badge-skipped">⏭ Skipped</span>,
    NOT_REQUIRED: <span className="text-xs text-slate-400">— N/A</span>,
  }[s] || <span className="badge-pending">{s}</span>);

  return (
    <div className="space-y-5 max-w-4xl mx-auto">
      <div className="animate-fade-in-up">
        <h1 className="section-title text-2xl">Excel Upload</h1>
        <p className="text-slate-500 text-sm mt-0.5">Upload attendance sheet — absent students are auto-notified via WhatsApp</p>
      </div>


      {/* Format preview */}
      <div className="card p-5 animate-fade-in-up">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm font-bold text-slate-700 flex items-center gap-2">
            <Info size={15} className="text-indigo-500" /> Required Excel Format
          </p>
          <button onClick={downloadSample} className="btn-secondary btn-sm">
            <Download size={13} /> Download Sample
          </button>
        </div>
        <div className="overflow-x-auto rounded-xl border border-slate-100">
          <table className="data-table">
            <thead><tr>
              {['Student ID','Student Name','Class','Date','Status'].map((c) => <th key={c} className="bg-slate-50">{c}</th>)}
            </tr></thead>
            <tbody>
              {[['STU001','Rahul Kumar','CSE-A','27-09-2026','Present'],
                ['STU002','Ravi Kumar','CSE-A','27-09-2026','Absent'],
                ['STU003','Kiran Kumar','CSE-A','27-09-2026','Present']].map((r, i) => (
                <tr key={i}>
                  <td><span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{r[0]}</span></td>
                  <td className="font-medium text-slate-700">{r[1]}</td>
                  <td>{r[2]}</td>
                  <td className="font-mono text-xs text-slate-500">{r[3]}</td>
                  <td>{r[4]==='Absent' ? <span className="badge-absent">Absent</span> : <span className="badge-present">Present</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1.5">
          <Info size={12} /> Parent WhatsApp numbers are NOT needed in Excel — fetched automatically from MongoDB
        </p>
      </div>

      {/* Upload zone */}
      <div className="card p-6 animate-fade-in-up">
        <p className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
          <Upload size={15} className="text-indigo-500" /> Upload Attendance File
        </p>
        <div
          className={`drop-zone ${dragging ? 'dragging' : ''}`}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => { e.preventDefault(); setDragging(false); handleFile(e.dataTransfer.files[0]); }}
        >
          <input type="file" ref={inputRef} accept=".xlsx,.xls" className="hidden"
            onChange={(e) => handleFile(e.target.files[0])} />
          {file ? (
            <div className="flex flex-col items-center gap-3">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background:'rgba(16,185,129,0.1)', border:'1px solid rgba(16,185,129,0.3)' }}>
                <FileSpreadsheet size={28} className="text-emerald-600" />
              </div>
              <div>
                <p className="font-bold text-slate-700">{file.name}</p>
                <p className="text-xs text-slate-400 mt-1">{(file.size/1024).toFixed(1)} KB · Click to change</p>
              </div>
              <button onClick={(e) => { e.stopPropagation(); setFile(null); setResult(null); }}
                className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700">
                <X size={12} /> Remove file
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3 text-slate-400">
              <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center">
                <FileSpreadsheet size={28} className="text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-600">Drop your Excel file here</p>
                <p className="text-xs text-slate-400 mt-1">or click to browse · .xlsx and .xls supported</p>
              </div>
            </div>
          )}
        </div>
        <button onClick={handleUpload} disabled={!file || uploading} className="btn-primary w-full justify-center mt-4 py-3">
          {uploading
            ? <><Loader2 size={16} className="animate-spin" /> Processing & Sending WhatsApp…</>
            : <><Upload size={16} /> Upload & Process Attendance</>}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-5 animate-fade-in-up">
          {result.success && (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { l:'Total',      v:result.totalStudents,  icon:Users,         bg:'from-blue-500 to-blue-600' },
                { l:'Present',    v:result.present,        icon:CheckCircle2,  bg:'from-emerald-500 to-teal-600' },
                { l:'Absent',     v:result.absent,         icon:XCircle,       bg:'from-red-500 to-rose-600' },
                { l:'WA Sent',    v:result.whatsappSent,   icon:MessageCircle, bg:'from-green-500 to-emerald-600' },
                { l:'Failed',     v:result.whatsappFailed, icon:AlertTriangle, bg:'from-red-500 to-rose-600' },
                { l:'Skipped',    v:result.whatsappSkipped,icon:MessageCircle, bg:'from-amber-400 to-orange-500' },
              ].map(({ l, v, icon: Icon, bg }) => (
                <div key={l} className="card p-4 flex flex-col items-center gap-2">
                  <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${bg} flex items-center justify-center`}>
                    <Icon size={16} className="text-white" />
                  </div>
                  <p className="text-2xl font-black text-slate-800" style={{fontFamily:'Plus Jakarta Sans,sans-serif'}}>{v}</p>
                  <p className="text-xs text-slate-500 font-medium">{l}</p>
                </div>
              ))}
            </div>
          )}

          {result.parseErrors?.length > 0 && (
            <div className="card p-5 border-l-4 border-amber-400">
              <p className="text-sm font-bold text-amber-700 mb-3 flex items-center gap-2">
                <AlertTriangle size={15} /> {result.parseErrors.length} rows skipped
              </p>
              <div className="space-y-1">
                {result.parseErrors.map((e, i) => (
                  <p key={i} className="text-xs text-slate-500">
                    <span className="font-mono font-bold text-amber-600">Row {e.rowIndex}:</span> {e.message}
                  </p>
                ))}
              </div>
            </div>
          )}

          {result.results?.length > 0 && (
            <div className="card overflow-hidden">
              <div className="px-6 py-4 border-b border-slate-100">
                <h3 className="font-bold text-slate-800 text-sm">Processing Results</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="data-table">
                  <thead><tr>
                    <th>Student ID</th><th>Name</th><th>Class</th><th>Date</th>
                    <th>Attendance</th><th>Parent WA</th><th>WhatsApp</th><th>Message</th>
                  </tr></thead>
                  <tbody>
                    {result.results.map((r, i) => (
                      <tr key={i}>
                        <td><span className="font-mono text-xs font-semibold text-indigo-600 bg-indigo-50 px-2 py-1 rounded-lg">{r.studentId}</span></td>
                        <td className="font-medium text-slate-700">{r.studentName}</td>
                        <td><span className="px-2 py-1 rounded-lg bg-purple-50 text-purple-700 text-xs font-semibold">{r.className}</span></td>
                        <td className="font-mono text-slate-500 text-xs">{r.date}</td>
                        <td>{r.attendance==='Absent' ? <span className="badge-absent">Absent</span> : <span className="badge-present">Present</span>}</td>
                        <td className="font-mono text-xs text-slate-500">{r.parentPhone}</td>
                        <td>{statusBadge(r.whatsapp)}</td>
                        <td className="text-xs text-slate-400 max-w-[180px] truncate" title={r.message}>{r.message}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default UploadPage;
