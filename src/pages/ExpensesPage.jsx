
import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getExpenses, getCategories, createExpense, updateExpense,
  deleteExpense, getSummary, uploadReceipt, exportExpenses
} from '../services/expenseService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';


const ICON_MAP = {
  food:'🍔', transport:'🚗', shopping:'🛍️', entertainment:'🎬',
  home:'🏠', health:'💊', travel:'✈️', education:'📚', other:'📦',
};

export default function ExpensesPage() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [expenses,   setExpenses]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [summary,    setSummary]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [editing,    setEditing]    = useState(null);
  const [form,       setForm]       = useState({ amount:'', categoryId:'', date:'', note:'' });
  const [submitting, setSubmitting] = useState(false);
  const [filterCat,  setFilterCat]  = useState('');

  // Receipt state
  const [receiptPreview, setReceiptPreview] = useState(null); // { url, expenseId }
  const [uploadingId,    setUploadingId]    = useState(null);

  // Export state
  const [showExport,  setShowExport]  = useState(false);
  const [exportFrom,  setExportFrom]  = useState('');
  const [exportTo,    setExportTo]    = useState('');
  const [exporting,   setExporting]   = useState(false);

  useEffect(() => {
    getCategories()
      .then(cats => {
        setCategories(cats);
        setForm(f => ({ ...f, categoryId: cats[0]?.id || '' }));
      })
      .catch(() => toast.error('Failed to load categories'));
  }, []);

  const loadExpenses = useCallback(async () => {
    try {
      const params = filterCat ? { categoryId: filterCat } : {};
      const [exp, sum] = await Promise.all([getExpenses(params), getSummary()]);
      setExpenses(exp);
      setSummary(sum);
    } catch {
      toast.error('Failed to load expenses');
    } finally {
      setLoading(false);
    }
  }, [filterCat]);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  const openAdd = () => {
    setEditing(null);
    setForm({ amount:'', categoryId: categories[0]?.id || '', date: today(), note:'' });
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    setForm({ amount: exp.amount, categoryId: exp.category.id, date: exp.date, note: exp.note || '' });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.categoryId || !form.date) {
      toast.error('Amount, category and date are required'); return;
    }
    setSubmitting(true);
    try {
      const payload = {
        amount:     parseFloat(form.amount),
        categoryId: parseInt(form.categoryId),
        date:       form.date,
        note:       form.note || null,
      };
      if (editing) {
        await updateExpense(editing.id, payload);
        toast.success('Expense updated');
      } else {
        await createExpense(payload);
        toast.success('Expense added');
      }
      setShowForm(false);
      loadExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save expense');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(id);
      toast.success('Expense deleted');
      loadExpenses();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleReceiptUpload = async (expenseId, file) => {
    if (!file) return;
    setUploadingId(expenseId);
    try {
      await uploadReceipt(expenseId, file);
      toast.success('Receipt uploaded');
      loadExpenses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploadingId(null);
    }
  };

  const handleViewReceipt = async (exp) => {
    try {
      const response = await api.get(exp.receiptUrl, { responseType: 'blob' });
      const blobUrl  = URL.createObjectURL(response.data);
      setReceiptPreview({ url: blobUrl, expenseId: exp.id });
    } catch {
      toast.error('Could not load receipt');
    }
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportExpenses(exportFrom || null, exportTo || null);
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `finsplit-expenses-${today()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      setShowExport(false);
      toast.success('CSV downloaded');
    } catch {
      toast.error('Export failed');
    } finally {
      setExporting(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div style={s.center}>Loading...</div>;

  return (
    <div>
      <Navbar/>

      <PageWrapper/>
        {/* Summary cards */}
        {summary && (
          <div style={s.summaryRow}>
            <div style={s.sumCard}>
              <div style={s.sumLabel}>This month</div>
              <div style={s.sumVal}>₹{Number(summary.totalThisMonth).toLocaleString('en-IN')}</div>
            </div>
            <div style={s.sumCard}>
              <div style={s.sumLabel}>Transactions</div>
              <div style={s.sumVal}>{summary.countThisMonth}</div>
            </div>
            {summary.categoryBreakdown[0] && (
              <div style={s.sumCard}>
                <div style={s.sumLabel}>Top category</div>
                <div style={s.sumVal}>{summary.categoryBreakdown[0].category}</div>
              </div>
            )}
          </div>
        )}

        {/* Header row */}
        <div style={s.headerRow}>
          <h2 style={s.heading}>My Expenses</h2>
          <div style={{ display:'flex', gap:8 }}>
            <select style={s.select} value={filterCat}
              onChange={e => setFilterCat(e.target.value)}>
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button style={s.outlineBtn} onClick={() => setShowExport(true)}>
              ↓ Export CSV
            </button>
            <button style={s.addBtn} onClick={openAdd}>+ Add expense</button>
          </div>
        </div>

        {/* Expense list */}
        {expenses.length === 0 ? (
          <div style={s.empty}>No expenses found. Click "+ Add expense" to start.</div>
        ) : (
          <div style={s.list}>
            {expenses.map(exp => (
              <div key={exp.id} style={s.expRow}>
                <div style={s.expIcon}>{ICON_MAP[exp.category.icon] || '📦'}</div>
                <div style={s.expMid}>
                  <div style={s.expCat}>{exp.category.name}</div>
                  <div style={s.expNote}>{exp.note || '—'}</div>
                </div>
                <div style={s.expRight}>
                  <div style={s.expAmount}>₹{Number(exp.amount).toLocaleString('en-IN')}</div>
                  <div style={s.expDate}>{formatDate(exp.date)}</div>
                </div>
                <div style={s.expActions}>
                  {/* Receipt button */}
                  {exp.receiptUrl ? (
                    <button style={s.receiptBtn}
                      onClick={() => handleViewReceipt(exp)}>
                      🧾 View
                    </button>
                  ) : (
                    <label style={{ ...s.receiptBtn, cursor:'pointer' }}>
                      {uploadingId === exp.id ? '...' : '+ Receipt'}
                      <input type="file" accept="image/*" style={{ display:'none' }}
                        onChange={e => handleReceiptUpload(exp.id, e.target.files[0])} />
                    </label>
                  )}
                  <button style={s.editBtn} onClick={() => openEdit(exp)}>Edit</button>
                  <button style={s.delBtn} onClick={() => handleDelete(exp.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>{editing ? 'Edit expense' : 'Add expense'}</h3>
            <form onSubmit={handleSubmit}>
              <label style={s.label}>Amount (₹)</label>
              <input style={s.input} type="number" step="0.01" min="0.01"
                placeholder="0.00" value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />

              <label style={s.label}>Category</label>
              <select style={s.input} value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>

              <label style={s.label}>Date</label>
              <input style={s.input} type="date" value={form.date} max={today()}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

              <label style={s.label}>Note (optional)</label>
              <input style={s.input} type="text" placeholder="e.g. Lunch with team"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />

              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button type="submit" style={s.addBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Update' : 'Add'}
                </button>
                <button type="button" style={s.cancelBtn}
                  onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Receipt preview modal */}
      {receiptPreview && (
        <div style={s.overlay} onClick={() => setReceiptPreview(null)}>
          <div style={{ ...s.modal, maxWidth:560, textAlign:'center' }}
            onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Receipt</h3>
            <img
              src={receiptPreview.url}
              alt="Receipt"
              style={{ maxWidth:'100%', maxHeight:420, borderRadius:8, objectFit:'contain' }}
              onError={() => toast.error('Could not load receipt image')}
            />
            <div style={{ marginTop:12 }}>
              <button style={s.cancelBtn} onClick={() => {
                if (receiptPreview?.url?.startsWith('blob:')) {
                  URL.revokeObjectURL(receiptPreview.url);
                }
                setReceiptPreview(null);
                }}>
                Close
              </button>
              {/* <button style={s.cancelBtn} onClick={() => setReceiptPreview(null)}>
                Close
              </button> */}
            </div>
          </div>
        </div>
      )}

      {/* Export CSV modal */}
      {showExport && (
        <div style={s.overlay} onClick={() => setShowExport(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Export expenses as CSV</h3>
            <p style={{ fontSize:13, color:'#9ca3af', marginBottom:12 }}>
              Leave dates empty to export all expenses.
            </p>

            <label style={s.label}>From date (optional)</label>
            <input style={s.input} type="date" value={exportFrom}
              onChange={e => setExportFrom(e.target.value)} />

            <label style={s.label}>To date (optional)</label>
            <input style={s.input} type="date" value={exportTo}
              onChange={e => setExportTo(e.target.value)} />

            <div style={{ display:'flex', gap:10, marginTop:16 }}>
              <button style={s.addBtn} onClick={handleExport} disabled={exporting}>
                {exporting ? 'Exporting...' : '↓ Download CSV'}
              </button>
              <button style={s.cancelBtn} onClick={() => setShowExport(false)}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function today() { return new Date().toISOString().split('T')[0]; }
function formatDate(d) {
  return new Date(d + 'T00:00:00').toLocaleDateString('en-IN', {
    day:'numeric', month:'short', year:'numeric'
  });
}

const s = {
  nav: { background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' },
  brand: { fontSize:'1.1rem', fontWeight:700, color:'#6366f1', cursor:'pointer' },
  navLinks: { display:'flex', alignItems:'center', gap:16 },
  navActive: { fontSize:'0.875rem', color:'#6366f1', fontWeight:500 },
  navLink: { fontSize:'0.875rem', color:'#6b7280', cursor:'pointer' },
  logoutBtn: { padding:'0.4rem 0.9rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer', color:'#374151' },
  page: { maxWidth:860, margin:'2rem auto', padding:'0 1.5rem' },
  summaryRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:24 },
  sumCard: { background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'1rem 1.25rem' },
  sumLabel: { fontSize:12, color:'#9ca3af', marginBottom:4 },
  sumVal: { fontSize:'1.3rem', fontWeight:600, color:'#111827' },
  headerRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16, flexWrap:'wrap', gap:10 },
  heading: { fontSize:'1.1rem', fontWeight:600, color:'#111827' },
  select: { padding:'0.45rem 0.75rem', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', color:'#374151', background:'#fff', cursor:'pointer' },
  addBtn: { padding:'0.48rem 1rem', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontSize:'0.875rem', fontWeight:500, cursor:'pointer' },
  outlineBtn: { padding:'0.48rem 1rem', background:'transparent', color:'#374151', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer' },
  cancelBtn: { padding:'0.48rem 1rem', background:'transparent', color:'#374151', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer' },
  list: { display:'flex', flexDirection:'column', gap:8 },
  expRow: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'0.9rem 1rem', display:'flex', alignItems:'center', gap:12, flexWrap:'wrap' },
  expIcon: { fontSize:24, flexShrink:0 },
  expMid: { flex:1, minWidth:120 },
  expCat: { fontSize:'0.9rem', fontWeight:500, color:'#111827' },
  expNote: { fontSize:'0.8rem', color:'#9ca3af', marginTop:2 },
  expRight: { textAlign:'right', marginRight:8 },
  expAmount: { fontSize:'1rem', fontWeight:600, color:'#111827' },
  expDate: { fontSize:'0.78rem', color:'#9ca3af', marginTop:2 },
  expActions: { display:'flex', gap:6, flexWrap:'wrap' },
  receiptBtn: { padding:'0.3rem 0.7rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:6, fontSize:'0.78rem', cursor:'pointer', color:'#374151' },
  editBtn: { padding:'0.3rem 0.7rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:6, fontSize:'0.78rem', cursor:'pointer', color:'#374151' },
  delBtn: { padding:'0.3rem 0.7rem', background:'transparent', border:'1px solid #fca5a5', borderRadius:6, fontSize:'0.78rem', cursor:'pointer', color:'#ef4444' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
  modal: { background:'#fff', borderRadius:12, padding:'1.75rem 2rem', width:'100%', maxWidth:420 },
  modalTitle: { fontSize:'1rem', fontWeight:600, color:'#111827', marginBottom:16 },
  label: { display:'block', fontSize:'0.875rem', fontWeight:500, color:'#374151', marginBottom:4, marginTop:12 },
  input: { width:'100%', padding:'0.55rem 0.85rem', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', color:'#111827', outline:'none', background:'#fff' },
  empty: { textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'0.9rem' },
  center: { display:'flex', justifyContent:'center', marginTop:'4rem', color:'#9ca3af', fontSize:14 },
};