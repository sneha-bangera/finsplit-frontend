import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { setBudget, getAnalytics } from '../services/budgetService';
import { getCategories } from '../services/expenseService';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';

export default function BudgetPage() {
  const { logout } = useAuth();
  const navigate   = useNavigate();

  const [analytics,   setAnalytics]   = useState(null);
  const [categories,  setCategories]  = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [submitting,  setSubmitting]  = useState(false);
  const [form,        setForm]        = useState({
    categoryId: '', monthYear: currentMonth(), limitAmount: ''
  });

  const load = async () => {
    try {
      const [ana, cats] = await Promise.all([getAnalytics(), getCategories()]);
      setAnalytics(ana);
      setCategories(cats);
      setForm(f => ({ ...f, categoryId: cats[0]?.id || '' }));
    } catch {
      toast.error('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.categoryId || !form.monthYear || !form.limitAmount) {
      toast.error('All fields are required'); return;
    }
    setSubmitting(true);
    try {
      await setBudget({
        categoryId:  parseInt(form.categoryId),
        monthYear:   form.monthYear,
        limitAmount: parseFloat(form.limitAmount),
      });
      toast.success('Budget saved!');
      setShowForm(false);
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div style={s.center}>Loading...</div>;

  const { budgetStatuses, last6Months } = analytics;
  const maxMonthly = Math.max(...last6Months.map(m => Number(m.totalSpent)), 1);

  return (
    <div>
      <Navbar/>

      <PageWrapper>

        {/* ── Monthly spend chart ─────────────────── */}
        <div style={s.card}>
          <div style={s.cardHeader}>
            <h2 style={s.cardTitle}>Monthly spending — last 6 months</h2>
          </div>
          <div style={s.chartWrap}>
            {last6Months.map(m => (
              <div key={m.monthYear} style={s.barCol}>
                <div style={s.barAmt}>
                  ₹{Number(m.totalSpent) >= 1000
                    ? (Number(m.totalSpent) / 1000).toFixed(1) + 'k'
                    : Number(m.totalSpent).toFixed(0)}
                </div>
                <div style={s.barTrack}>
                  <div style={{
                    ...s.barFill,
                    height: `${Math.round((Number(m.totalSpent) / maxMonthly) * 100)}%`,
                  }} />
                </div>
                <div style={s.barLabel}>{shortMonth(m.monthYear)}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Budget statuses ─────────────────────── */}
        <div style={s.sectionHeader}>
          <h2 style={s.cardTitle}>Budgets — {currentMonth()}</h2>
          <button style={s.addBtn} onClick={() => setShowForm(true)}>
            + Set budget
          </button>
        </div>

        {budgetStatuses.length === 0 ? (
          <div style={s.empty}>
            No budgets set for this month yet. Click "+ Set budget" to start.
          </div>
        ) : (
          <div style={s.budgetList}>
            {budgetStatuses.map(b => (
              <div key={b.budgetId} style={s.budgetCard}>
                <div style={s.budgetTop}>
                  <div>
                    <div style={s.budgetCat}>{b.categoryName}</div>
                    <div style={s.budgetMeta}>
                      ₹{Number(b.spentAmount).toLocaleString('en-IN')} spent of{' '}
                      ₹{Number(b.limitAmount).toLocaleString('en-IN')}
                    </div>
                  </div>
                  <div style={{
                    ...s.pctBadge,
                    background: b.exceeded ? '#fef2f2' : b.percentageUsed >= 80 ? '#fffbeb' : '#f0fdf4',
                    color:      b.exceeded ? '#ef4444' : b.percentageUsed >= 80 ? '#d97706' : '#16a34a',
                  }}>
                    {b.percentageUsed.toFixed(0)}%
                  </div>
                </div>

                {/* Progress bar */}
                <div style={s.progTrack}>
                  <div style={{
                    ...s.progFill,
                    width: `${Math.min(b.percentageUsed, 100)}%`,
                    background: b.exceeded ? '#ef4444' : b.percentageUsed >= 80 ? '#f59e0b' : '#6366f1',
                  }} />
                </div>

                <div style={s.budgetBottom}>
                  <span style={{ color: '#9ca3af', fontSize: 12 }}>
                    {b.exceeded
                      ? `Over by ₹${Math.abs(Number(b.remaining)).toLocaleString('en-IN')}`
                      : `₹${Number(b.remaining).toLocaleString('en-IN')} remaining`}
                  </span>
                  {b.exceeded && (
                    <span style={s.alertBadge}>⚠️ Alert sent</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </PageWrapper>

      {/* Set budget modal */}
      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Set budget</h3>
            <form onSubmit={handleSubmit}>
              <label style={s.label}>Category</label>
              <select style={s.input} value={form.categoryId}
                onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))}>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              <label style={s.label}>Month</label>
              <input style={s.input} type="month" value={form.monthYear}
                onChange={e => setForm(f => ({ ...f, monthYear: e.target.value }))} />

              <label style={s.label}>Budget limit (₹)</label>
              <input style={s.input} type="number" step="1" min="1"
                placeholder="e.g. 5000"
                value={form.limitAmount}
                onChange={e => setForm(f => ({ ...f, limitAmount: e.target.value }))} />

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="submit" style={s.addBtn} disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save budget'}
                </button>
                <button type="button" style={s.cancelBtn}
                  onClick={() => setShowForm(false)}>
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

// ── helpers ──────────────────────────────
function currentMonth() {
  return new Date().toISOString().slice(0, 7); // "2026-06"
}

function shortMonth(monthYear) {
  const [y, m] = monthYear.split('-');
  const date = new Date(parseInt(y), parseInt(m) - 1, 1);
  return date.toLocaleString('en-IN', { month: 'short' }) + ' ' + y.slice(2);
}

// ── styles ────────────────────────────────
const s = {
  nav: { background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' },
  brand: { fontSize:'1.1rem', fontWeight:700, color:'#6366f1', cursor:'pointer' },
  navLinks: { display:'flex', alignItems:'center', gap:16 },
  navActive: { fontSize:'0.875rem', color:'#6366f1', fontWeight:500 },
  navLink: { fontSize:'0.875rem', color:'#6b7280', cursor:'pointer' },
  logoutBtn: { padding:'0.4rem 0.9rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer', color:'#374151' },
  page: { maxWidth:860, margin:'2rem auto', padding:'0 1.5rem' },

  card: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'1.5rem', marginBottom:24 },
  cardHeader: { marginBottom:16 },
  cardTitle: { fontSize:'1rem', fontWeight:600, color:'#111827' },

  chartWrap: { display:'flex', alignItems:'flex-end', gap:12, height:160, paddingTop:8 },
  barCol: { flex:1, display:'flex', flexDirection:'column', alignItems:'center', gap:6, height:'100%' },
  barAmt: { fontSize:11, color:'#9ca3af', textAlign:'center' },
  barTrack: { flex:1, width:'100%', background:'#f3f4f6', borderRadius:6, display:'flex', alignItems:'flex-end', overflow:'hidden' },
  barFill: { width:'100%', background:'#6366f1', borderRadius:6, minHeight:4, transition:'height 0.3s' },
  barLabel: { fontSize:11, color:'#6b7280', textAlign:'center', whiteSpace:'nowrap' },

  sectionHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  addBtn: { padding:'0.48rem 1rem', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontSize:'0.875rem', fontWeight:500, cursor:'pointer' },
  cancelBtn: { padding:'0.48rem 1rem', background:'transparent', color:'#374151', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer' },
  empty: { textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'0.9rem' },

  budgetList: { display:'flex', flexDirection:'column', gap:10 },
  budgetCard: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'1rem 1.25rem' },
  budgetTop: { display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 },
  budgetCat: { fontSize:'0.9rem', fontWeight:500, color:'#111827' },
  budgetMeta: { fontSize:'0.8rem', color:'#9ca3af', marginTop:2 },
  pctBadge: { fontSize:'0.85rem', fontWeight:600, padding:'3px 10px', borderRadius:20 },
  progTrack: { height:8, background:'#f3f4f6', borderRadius:999, overflow:'hidden', marginBottom:8 },
  progFill: { height:'100%', borderRadius:999, transition:'width 0.4s' },
  budgetBottom: { display:'flex', alignItems:'center', justifyContent:'space-between' },
  alertBadge: { fontSize:11, color:'#ef4444', background:'#fef2f2', padding:'2px 8px', borderRadius:20 },

  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
  modal: { background:'#fff', borderRadius:12, padding:'1.75rem 2rem', width:'100%', maxWidth:420 },
  modalTitle: { fontSize:'1rem', fontWeight:600, color:'#111827', marginBottom:16 },
  label: { display:'block', fontSize:'0.875rem', fontWeight:500, color:'#374151', marginBottom:4, marginTop:12 },
  input: { width:'100%', padding:'0.55rem 0.85rem', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', color:'#111827', outline:'none', background:'#fff' },
  center: { display:'flex', justifyContent:'center', marginTop:'4rem', color:'#9ca3af', fontSize:14 },
};