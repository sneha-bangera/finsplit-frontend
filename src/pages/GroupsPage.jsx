import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import { getMyGroups, createGroup } from '../services/groupService';

export default function GroupsPage() {
  const { logout, user } = useAuth();
  const navigate         = useNavigate();

  const [groups,     setGroups]     = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [showForm,   setShowForm]   = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form,       setForm]       = useState({ name: '', description: '' });

  const load = async () => {
    try {
      setGroups(await getMyGroups());
    } catch {
      toast.error('Failed to load groups');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Group name is required'); return; }
    setSubmitting(true);
    try {
      await createGroup(form);
      toast.success('Group created!');
      setShowForm(false);
      setForm({ name: '', description: '' });
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div style={s.center}>Loading...</div>;

  return (
    <div>
      <nav style={s.nav}>
        <span style={s.brand} onClick={() => navigate('/dashboard')} role="button">FinSplit</span>
        <div style={s.navLinks}>
          <span style={s.navLink} onClick={() => navigate('/expenses')}>Expenses</span>
          <span style={s.navLink} onClick={() => navigate('/budgets')}>Budgets</span>
          <span style={s.navActive}>Groups</span>
          <button style={s.logoutBtn} onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div style={s.page}>
        <div style={s.headerRow}>
          <h2 style={s.heading}>My Groups</h2>
          <button style={s.addBtn} onClick={() => setShowForm(true)}>+ New group</button>
        </div>

        {groups.length === 0 ? (
          <div style={s.empty}>
            No groups yet. Create one to start splitting expenses with friends.
          </div>
        ) : (
          <div style={s.grid}>
            {groups.map(g => (
              <div key={g.id} style={s.groupCard}
                onClick={() => navigate(`/groups/${g.id}`)} role="button">
                <div style={s.groupAvatar}>
                  {g.name.charAt(0).toUpperCase()}
                </div>
                <div style={s.groupInfo}>
                  <div style={s.groupName}>{g.name}</div>
                  {g.description && (
                    <div style={s.groupDesc}>{g.description}</div>
                  )}
                  <div style={s.groupMeta}>
                    {g.members.length} member{g.members.length !== 1 ? 's' : ''} ·{' '}
                    {g.expenseCount} expense{g.expenseCount !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={s.chevron}>›</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div style={s.overlay} onClick={() => setShowForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Create group</h3>
            <form onSubmit={handleCreate}>
              <label style={s.label}>Group name</label>
              <input style={s.input} type="text" placeholder="e.g. Goa Trip"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />

              <label style={s.label}>Description (optional)</label>
              <input style={s.input} type="text" placeholder="e.g. June 2026"
                value={form.description}
                onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />

              <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                <button type="submit" style={s.addBtn} disabled={submitting}>
                  {submitting ? 'Creating...' : 'Create'}
                </button>
                <button type="button" style={s.cancelBtn}
                  onClick={() => setShowForm(false)}>Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  nav: { background:'#fff', borderBottom:'1px solid #e5e7eb', padding:'0 1.5rem', height:60, display:'flex', alignItems:'center', justifyContent:'space-between' },
  brand: { fontSize:'1.1rem', fontWeight:700, color:'#6366f1', cursor:'pointer' },
  navLinks: { display:'flex', alignItems:'center', gap:16 },
  navActive: { fontSize:'0.875rem', color:'#6366f1', fontWeight:500 },
  navLink: { fontSize:'0.875rem', color:'#6b7280', cursor:'pointer' },
  logoutBtn: { padding:'0.4rem 0.9rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer', color:'#374151' },
  page: { maxWidth:860, margin:'2rem auto', padding:'0 1.5rem' },
  headerRow: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:20 },
  heading: { fontSize:'1.1rem', fontWeight:600, color:'#111827' },
  addBtn: { padding:'0.48rem 1rem', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontSize:'0.875rem', fontWeight:500, cursor:'pointer' },
  cancelBtn: { padding:'0.48rem 1rem', background:'transparent', color:'#374151', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer' },
  grid: { display:'flex', flexDirection:'column', gap:8 },
  groupCard: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:12, padding:'1rem 1.25rem', display:'flex', alignItems:'center', gap:14, cursor:'pointer', transition:'border-color 0.15s' },
  groupAvatar: { width:44, height:44, borderRadius:'50%', background:'#EEEDFE', color:'#534AB7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.1rem', fontWeight:600, flexShrink:0 },
  groupInfo: { flex:1 },
  groupName: { fontSize:'0.95rem', fontWeight:500, color:'#111827' },
  groupDesc: { fontSize:'0.8rem', color:'#9ca3af', marginTop:2 },
  groupMeta: { fontSize:'0.78rem', color:'#9ca3af', marginTop:4 },
  chevron: { fontSize:'1.3rem', color:'#d1d5db' },
  empty: { textAlign:'center', padding:'3rem', color:'#9ca3af', fontSize:'0.9rem' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
  modal: { background:'#fff', borderRadius:12, padding:'1.75rem 2rem', width:'100%', maxWidth:420 },
  modalTitle: { fontSize:'1rem', fontWeight:600, color:'#111827', marginBottom:16 },
  label: { display:'block', fontSize:'0.875rem', fontWeight:500, color:'#374151', marginBottom:4, marginTop:12 },
  input: { width:'100%', padding:'0.55rem 0.85rem', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', color:'#111827', outline:'none', background:'#fff' },
  center: { display:'flex', justifyContent:'center', marginTop:'4rem', color:'#9ca3af', fontSize:14 },
};