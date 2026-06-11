import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import {
  getExpenses, getCategories, createExpense,
  updateExpense, deleteExpense, getSummary
} from '../services/expenseService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const ICON_MAP = {
  food: '🍔', transport: '🚗', shopping: '🛍️',
  entertainment: '🎬', home: '🏠', health: '💊',
  travel: '✈️', education: '📚', other: '📦',
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
  const [form,       setForm]       = useState({ amount: '', categoryId: '', date: '', note: '' });
  const [submitting, setSubmitting] = useState(false);
  const [filterCat,  setFilterCat]  = useState('');

  // Load categories once — separate from expense loading
  useEffect(() => {
    getCategories()
      .then(cats => {
        setCategories(cats);
        // Set default categoryId in form once categories are loaded
        setForm(f => ({ ...f, categoryId: cats[0]?.id || '' }));
      })
      .catch(() => toast.error('Failed to load categories'));
  }, []); // runs only once on mount

  const loadExpenses = useCallback(async () => {
    try {
      const params = filterCat ? { categoryId: filterCat } : {};
      const [exp, sum] = await Promise.all([
        getExpenses(params),
        getSummary(),
      ]);
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
    setForm({
      amount: '',
      categoryId: categories[0]?.id || '',
      date: today(),
      note: ''
    });
    setShowForm(true);
  };

  const openEdit = (exp) => {
    setEditing(exp);
    setForm({
      amount: exp.amount,
      categoryId: exp.category.id,
      date: exp.date,
      note: exp.note || ''
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.amount || !form.categoryId || !form.date) {
      toast.error('Amount, category and date are required');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        amount: parseFloat(form.amount),
        categoryId: parseInt(form.categoryId),
        date: form.date,
        note: form.note || null,
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

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div style={styles.center}>Loading...</div>;

  return (
    <div>
      <nav style={styles.nav}>
        <span style={styles.brand} onClick={() => navigate('/dashboard')} role="button">
          FinSplit
        </span>
        <div style={styles.navLinks}>
          <span style={styles.navActive}>Expenses</span>
          <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={styles.page}>

        {/* Summary cards */}
        {summary && (
          <div style={styles.summaryRow}>
            <div style={styles.sumCard}>
              <div style={styles.sumLabel}>This month</div>
              <div style={styles.sumVal}>
                ₹{Number(summary.totalThisMonth).toLocaleString('en-IN')}
              </div>
            </div>
            <div style={styles.sumCard}>
              <div style={styles.sumLabel}>Transactions</div>
              <div style={styles.sumVal}>{summary.countThisMonth}</div>
            </div>
            {summary.categoryBreakdown[0] && (
              <div style={styles.sumCard}>
                <div style={styles.sumLabel}>Top category</div>
                <div style={styles.sumVal}>{summary.categoryBreakdown[0].category}</div>
              </div>
            )}
          </div>
        )}

        {/* Header row */}
        <div style={styles.headerRow}>
          <h2 style={styles.heading}>My Expenses</h2>
          <div style={{ display: 'flex', gap: 10 }}>
            <select
              style={styles.select}
              value={filterCat}
              onChange={e => setFilterCat(e.target.value)}
            >
              <option value="">All categories</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <button style={styles.addBtn} onClick={openAdd}>+ Add expense</button>
          </div>
        </div>

        {/* Expense list */}
        {expenses.length === 0 ? (
          <div style={styles.empty}>
            No expenses found. Click "+ Add expense" to start.
          </div>
        ) : (
          <div style={styles.list}>
            {expenses.map(exp => (
              <div key={exp.id} style={styles.expRow}>
                <div style={styles.expIcon}>
                  {ICON_MAP[exp.category.icon] || '📦'}
                </div>
                <div style={styles.expMid}>
                  <div style={styles.expCat}>{exp.category.name}</div>
                  <div style={styles.expNote}>{exp.note || '—'}</div>
                </div>
                <div style={styles.expRight}>
                  <div style={styles.expAmount}>
                    ₹{Number(exp.amount).toLocaleString('en-IN')}
                  </div>
                  <div style={styles.expDate}>{formatDate(exp.date)}</div>
                </div>
                <div style={styles.expActions}>
                  <button style={styles.editBtn} onClick={() => openEdit(exp)}>Edit</button>
                  <button style={styles.delBtn} onClick={() => handleDelete(exp.id)}>Delete</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showForm && (
        <div style={styles.overlay} onClick={() => setShowForm(false)}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editing ? 'Edit expense' : 'Add expense'}
            </h3>
            <form onSubmit={handleSubmit}>
              <label style={styles.label}>Amount (₹)</label>
              <input
                style={styles.input}
                type="number"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={form.amount}
                onChange={e => setForm(f => ({ ...f, amount: e.target.value }))}
              />

              <label style={styles.label}>Category</label>
              <select
                style={styles.input}
                value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}
              >
                {categories.length === 0 && (
                  <option value="">Loading categories...</option>
                )}
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label style={styles.label}>Date</label>
              <input
                style={styles.input}
                type="date"
                value={form.date}
                max={today()}
                onChange={e => setForm(f => ({ ...f, date: e.target.value }))}
              />

              <label style={styles.label}>Note (optional)</label>
              <input
                style={styles.input}
                type="text"
                placeholder="e.g. Lunch with team"
                value={form.note}
                onChange={e => setForm(f => ({ ...f, note: e.target.value }))}
              />

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="submit" style={styles.addBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : editing ? 'Update' : 'Add'}
                </button>
                <button
                  type="button"
                  style={styles.cancelBtn}
                  onClick={() => setShowForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function today() {
  return new Date().toISOString().split('T')[0];
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });
}

const styles = {
  nav: { background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' },
  brand: { fontSize:'1.1rem', fontWeight:700, color:'#6366f1', cursor:'pointer' },
  navLinks: { display:'flex', alignItems:'center', gap:16 },
  navActive: { fontSize:'0.875rem', color:'#6366f1', fontWeight:500 },
  logoutBtn: { padding:'0.4rem 0.9rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer', color:'#374151' },
  page: { maxWidth:860, margin:'2rem auto', padding:'0 1.5rem' },
  summaryRow: { display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:12, marginBottom:24 },
  sumCard: { background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'1rem 1.25rem' },
  sumLabel: { fontSize:12, color:'#9ca3af', marginBottom:4 },
  sumVal: { fontSize:'1.3rem', fontWeight:600, color:'#111827' },
  headerRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  heading: { fontSize:'1.1rem', fontWeight:600, color:'#111827' },
  select: { padding:'0.45rem 0.75rem', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', color:'#374151', background:'#fff', cursor:'pointer' },
  addBtn: { padding:'0.48rem 1rem', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontSize:'0.875rem', fontWeight:500, cursor:'pointer' },
  cancelBtn: { padding:'0.48rem 1rem', background:'transparent', color:'#374151', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer' },
  list: { display:'flex', flexDirection:'column', gap:8 },
  expRow: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'0.9rem 1rem', display:'flex', alignItems:'center', gap:12 },
  expIcon: { fontSize:24, flexShrink:0 },
  expMid: { flex:1 },
  expCat: { fontSize:'0.9rem', fontWeight:500, color:'#111827' },
  expNote: { fontSize:'0.8rem', color:'#9ca3af', marginTop:2 },
  expRight: { textAlign:'right', marginRight:8 },
  expAmount: { fontSize:'1rem', fontWeight:600, color:'#111827' },
  expDate: { fontSize:'0.78rem', color:'#9ca3af', marginTop:2 },
  expActions: { display:'flex', gap:6 },
  editBtn: { padding:'0.3rem 0.7rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:6, fontSize:'0.78rem', cursor:'pointer', color:'#374151' },
  delBtn: { padding:'0.3rem 0.7rem', background:'transparent', border:'1px solid #fca5a5', borderRadius:6, fontSize:'0.78rem', cursor:'pointer', color:'#ef4444' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
  modal: { background:'#fff', borderRadius:12, padding:'1.75rem 2rem', width:'100%', maxWidth:420 },
  modalTitle: { fontSize:'1rem', fontWeight:600, color:'#111827', marginBottom:16 },
  label: { display:'block', fontSize:'0.875rem', fontWeight:500, color:'#374151', marginBottom:4, marginTop:12 },
  input: { width:'100%', padding:'0.55rem 0.85rem', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', color:'#111827', outline:'none', background:'#fff' },
  empty: { textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'0.9rem' },
  center: { display:'flex', justifyContent:'center', marginTop:'4rem', color:'#9ca3af', fontSize:'14px' },
};

// import { useState, useEffect, useCallback } from 'react';
// import { toast } from 'react-toastify';
// import {
//   getExpenses, getCategories, createExpense,
//   updateExpense, deleteExpense, getSummary
// } from '../services/expenseService';
// import { useNavigate } from 'react-router-dom';
// import { useAuth } from '../context/AuthContext';

// const ICON_MAP = {
//   food: '🍔', transport: '🚗', shopping: '🛍️',
//   entertainment: '🎬', home: '🏠', health: '💊',
//   travel: '✈️', education: '📚', other: '📦',
// };

// export default function ExpensesPage() {
//   const { logout } = useAuth();
//   const navigate   = useNavigate();

//   const [expenses,   setExpenses]   = useState([]);
//   const [categories, setCategories] = useState([]);
//   const [summary,    setSummary]    = useState(null);
//   const [loading,    setLoading]    = useState(true);

//   // form state
//   const [showForm,   setShowForm]   = useState(false);
//   const [editing,    setEditing]    = useState(null); // expense object or null
//   const [form,       setForm]       = useState({ amount: '', categoryId: '', date: '', note: '' });
//   const [submitting, setSubmitting] = useState(false);

//   // filter state
//   const [filterCat,  setFilterCat]  = useState('');

//   const load = useCallback(async () => {
//     try {
//       const [exp, cats, sum] = await Promise.all([
//         getExpenses(filterCat ? { categoryId: filterCat } : {}),
//         getCategories(),
//         getSummary(),
//       ]);
//       setExpenses(exp);
//       setCategories(cats);
//       setSummary(sum);
//     } catch {
//       toast.error('Failed to load expenses');
//     } finally {
//       setLoading(false);
//     }
//   }, [filterCat]);

//   useEffect(() => { load(); }, [load]);

//   const openAdd = () => {
//     setEditing(null);
//     setForm({ amount: '', categoryId: categories[0]?.id || '', date: today(), note: '' });
//     setShowForm(true);
//   };

//   const openEdit = (exp) => {
//     setEditing(exp);
//     setForm({ amount: exp.amount, categoryId: exp.category.id, date: exp.date, note: exp.note || '' });
//     setShowForm(true);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     if (!form.amount || !form.categoryId || !form.date) {
//       toast.error('Amount, category and date are required'); return;
//     }
//     setSubmitting(true);
//     try {
//       if (editing) {
//         await updateExpense(editing.id, form);
//         toast.success('Expense updated');
//       } else {
//         await createExpense(form);
//         toast.success('Expense added');
//       }
//       setShowForm(false);
//       load();
//     } catch {
//       toast.error('Failed to save expense');
//     } finally {
//       setSubmitting(false);
//     }
//   };

//   const handleDelete = async (id) => {
//     if (!window.confirm('Delete this expense?')) return;
//     try {
//       await deleteExpense(id);
//       toast.success('Expense deleted');
//       load();
//     } catch {
//       toast.error('Failed to delete');
//     }
//   };

//   const handleLogout = () => { logout(); navigate('/login'); };

//   if (loading) return <div style={styles.center}>Loading...</div>;

//   return (
//     <div>
//       {/* Navbar */}
//       <nav style={styles.nav}>
//         <span style={styles.brand} onClick={() => navigate('/dashboard')} role="button">FinSplit</span>
//         <div style={styles.navLinks}>
//           <span style={styles.navActive}>Expenses</span>
//           <button style={styles.logoutBtn} onClick={handleLogout}>Logout</button>
//         </div>
//       </nav>

//       <div style={styles.page}>

//         {/* Summary cards */}
//         {summary && (
//           <div style={styles.summaryRow}>
//             <div style={styles.sumCard}>
//               <div style={styles.sumLabel}>This month</div>
//               <div style={styles.sumVal}>₹{Number(summary.totalThisMonth).toLocaleString('en-IN')}</div>
//             </div>
//             <div style={styles.sumCard}>
//               <div style={styles.sumLabel}>Transactions</div>
//               <div style={styles.sumVal}>{summary.countThisMonth}</div>
//             </div>
//             {summary.categoryBreakdown[0] && (
//               <div style={styles.sumCard}>
//                 <div style={styles.sumLabel}>Top category</div>
//                 <div style={styles.sumVal}>{summary.categoryBreakdown[0].category}</div>
//               </div>
//             )}
//           </div>
//         )}

//         {/* Header row */}
//         <div style={styles.headerRow}>
//           <h2 style={styles.heading}>My Expenses</h2>
//           <div style={{ display: 'flex', gap: 10 }}>
//             <select style={styles.select} value={filterCat}
//               onChange={e => setFilterCat(e.target.value)}>
//               <option value="">All categories</option>
//               {categories.map(c => (
//                 <option key={c.id} value={c.id}>{c.name}</option>
//               ))}
//             </select>
//             <button style={styles.addBtn} onClick={openAdd}>+ Add expense</button>
//           </div>
//         </div>

//         {/* Expense list */}
//         {expenses.length === 0 ? (
//           <div style={styles.empty}>No expenses yet. Click "+ Add expense" to start.</div>
//         ) : (
//           <div style={styles.list}>
//             {expenses.map(exp => (
//               <div key={exp.id} style={styles.expRow}>
//                 <div style={styles.expIcon}>
//                   {ICON_MAP[exp.category.icon] || '📦'}
//                 </div>
//                 <div style={styles.expMid}>
//                   <div style={styles.expCat}>{exp.category.name}</div>
//                   <div style={styles.expNote}>{exp.note || '—'}</div>
//                 </div>
//                 <div style={styles.expRight}>
//                   <div style={styles.expAmount}>₹{Number(exp.amount).toLocaleString('en-IN')}</div>
//                   <div style={styles.expDate}>{formatDate(exp.date)}</div>
//                 </div>
//                 <div style={styles.expActions}>
//                   <button style={styles.editBtn} onClick={() => openEdit(exp)}>Edit</button>
//                   <button style={styles.delBtn} onClick={() => handleDelete(exp.id)}>Delete</button>
//                 </div>
//               </div>
//             ))}
//           </div>
//         )}
//       </div>

//       {/* Add / Edit modal */}
//       {showForm && (
//         <div style={styles.overlay} onClick={() => setShowForm(false)}>
//           <div style={styles.modal} onClick={e => e.stopPropagation()}>
//             <h3 style={styles.modalTitle}>{editing ? 'Edit expense' : 'Add expense'}</h3>
//             <form onSubmit={handleSubmit}>
//               <label style={styles.label}>Amount (₹)</label>
//               <input style={styles.input} type="number" step="0.01" placeholder="0.00"
//                 value={form.amount} onChange={e => setForm(f => ({ ...f, amount: e.target.value }))} />

//               <label style={styles.label}>Category</label>
//               <select style={styles.input} value={form.categoryId}
//                 onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
//                 {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
//               </select>

//               <label style={styles.label}>Date</label>
//               <input style={styles.input} type="date" value={form.date}
//                 onChange={e => setForm(f => ({ ...f, date: e.target.value }))} />

//               <label style={styles.label}>Note (optional)</label>
//               <input style={styles.input} type="text" placeholder="e.g. Lunch with team"
//                 value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} />

//               <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
//                 <button type="submit" style={styles.addBtn} disabled={submitting}>
//                   {submitting ? 'Saving...' : editing ? 'Update' : 'Add'}
//                 </button>
//                 <button type="button" style={styles.cancelBtn} onClick={() => setShowForm(false)}>
//                   Cancel
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       )}
//     </div>
//   );
// }

// // ── helpers ──────────────────────────────────────────────
// function today() {
//   return new Date().toISOString().split('T')[0];
// }

// function formatDate(dateStr) {
//   return new Date(dateStr).toLocaleDateString('en-IN', {
//     day: 'numeric', month: 'short', year: 'numeric'
//   });
// }

// // ── styles ───────────────────────────────────────────────
// const styles = {
//   nav: { background: '#fff', borderBottom: '1px solid #e5e7eb', padding: '0 1.5rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between' },
//   brand: { fontSize: '1.1rem', fontWeight: 700, color: '#6366f1', cursor: 'pointer' },
//   navLinks: { display: 'flex', alignItems: 'center', gap: 16 },
//   navActive: { fontSize: '0.875rem', color: '#6366f1', fontWeight: 500 },
//   logoutBtn: { padding: '0.4rem 0.9rem', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer', color: '#374151' },
//   page: { maxWidth: 860, margin: '2rem auto', padding: '0 1.5rem' },
//   summaryRow: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 },
//   sumCard: { background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: 10, padding: '1rem 1.25rem' },
//   sumLabel: { fontSize: 12, color: '#9ca3af', marginBottom: 4 },
//   sumVal: { fontSize: '1.3rem', fontWeight: 600, color: '#111827' },
//   headerRow: { display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
//   heading: { fontSize: '1.1rem', fontWeight: 600, color: '#111827' },
//   select: { padding: '0.45rem 0.75rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', color: '#374151', background: '#fff', cursor: 'pointer' },
//   addBtn: { padding: '0.48rem 1rem', background: '#6366f1', color: '#fff', border: 'none', borderRadius: 8, fontSize: '0.875rem', fontWeight: 500, cursor: 'pointer' },
//   cancelBtn: { padding: '0.48rem 1rem', background: 'transparent', color: '#374151', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', cursor: 'pointer' },
//   list: { display: 'flex', flexDirection: 'column', gap: 8 },
//   expRow: { background: '#fff', border: '1px solid #e5e7eb', borderRadius: 10, padding: '0.9rem 1rem', display: 'flex', alignItems: 'center', gap: 12 },
//   expIcon: { fontSize: 24, flexShrink: 0 },
//   expMid: { flex: 1 },
//   expCat: { fontSize: '0.9rem', fontWeight: 500, color: '#111827' },
//   expNote: { fontSize: '0.8rem', color: '#9ca3af', marginTop: 2 },
//   expRight: { textAlign: 'right', marginRight: 8 },
//   expAmount: { fontSize: '1rem', fontWeight: 600, color: '#111827' },
//   expDate: { fontSize: '0.78rem', color: '#9ca3af', marginTop: 2 },
//   expActions: { display: 'flex', gap: 6 },
//   editBtn: { padding: '0.3rem 0.7rem', background: 'transparent', border: '1px solid #d1d5db', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer', color: '#374151' },
//   delBtn: { padding: '0.3rem 0.7rem', background: 'transparent', border: '1px solid #fca5a5', borderRadius: 6, fontSize: '0.78rem', cursor: 'pointer', color: '#ef4444' },
//   overlay: { position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 },
//   modal: { background: '#fff', borderRadius: 12, padding: '1.75rem 2rem', width: '100%', maxWidth: 420 },
//   modalTitle: { fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: 16 },
//   label: { display: 'block', fontSize: '0.875rem', fontWeight: 500, color: '#374151', marginBottom: 4, marginTop: 12 },
//   input: { width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #d1d5db', borderRadius: 8, fontSize: '0.875rem', color: '#111827', outline: 'none' },
//   empty: { textAlign: 'center', padding: '3rem', color: '#9ca3af', fontSize: '0.9rem' },
//   center: { display: 'flex', justifyContent: 'center', marginTop: '4rem', color: '#9ca3af' },
// };