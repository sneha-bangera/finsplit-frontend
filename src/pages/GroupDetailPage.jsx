import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../context/AuthContext';
import {getGroup, addMember, getExpenses, addExpense,deleteExpense, getBalances, markSettled} from '../services/groupService';
import Navbar from '../components/Navbar';
import PageWrapper from '../components/PageWrapper';

const TABS = ['Expenses', 'Balances', 'Members'];

export default function GroupDetailPage() {
  const { groupId }      = useParams();
  const { logout, user } = useAuth();
  const navigate         = useNavigate();

  const [group,      setGroup]      = useState(null);
  const [expenses,   setExpenses]   = useState([]);
  const [balances,   setBalances]   = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [activeTab,  setActiveTab]  = useState('Expenses');

  // Add expense form
  const [showExpForm,  setShowExpForm]  = useState(false);
  const [expForm,      setExpForm]      = useState({
    amount: '', description: '', date: today(), splitType: 'EQUAL'
  });
  const [customSplits, setCustomSplits] = useState({});
  const [submittingExp, setSubmittingExp] = useState(false);

  // Add member form
  const [showMemForm,  setShowMemForm]  = useState(false);
  const [memberEmail,  setMemberEmail]  = useState('');
  const [submittingMem, setSubmittingMem] = useState(false);

  const load = async () => {
    try {
      const [grp, exps, bals] = await Promise.all([
        getGroup(groupId),
        getExpenses(groupId),
        getBalances(groupId),
      ]);
      setGroup(grp);
      setExpenses(exps);
      setBalances(bals);
    } catch {
      toast.error('Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [groupId]);

  const handleAddExpense = async (e) => {
  e.preventDefault();
  if (!expForm.amount || !expForm.description || !expForm.date) {
    toast.error('All fields are required'); return;
  }

  // Validate custom splits total
  if (expForm.splitType === 'CUSTOM') {
    const total  = Object.values(customSplits)
      .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
    const target = parseFloat(expForm.amount);
    if (Math.abs(total - target) > 0.01) {
      toast.error(`Custom split total (₹${total.toFixed(2)}) must equal expense amount (₹${target.toFixed(2)})`);
      return;
    }
  }

  setSubmittingExp(true);
  try {
    const payload = {
      amount:       parseFloat(expForm.amount),
      description:  expForm.description,
      date:         expForm.date,
      splitType:    expForm.splitType,
      customSplits: expForm.splitType === 'CUSTOM'
        ? Object.fromEntries(
            Object.entries(customSplits).map(([k, v]) => [k, parseFloat(v)])
          )
        : null,
    };
    await addExpense(groupId, payload);
    toast.success('Expense added');
    setShowExpForm(false);
    setExpForm({ amount: '', description: '', date: today(), splitType: 'EQUAL' });
    setCustomSplits({});
    load();
  } catch (err) {
    toast.error(err.response?.data?.message || 'Failed to add expense');
  } finally {
    setSubmittingExp(false);
  }
};

  const handleDeleteExpense = async (expId) => {
    if (!window.confirm('Delete this expense?')) return;
    try {
      await deleteExpense(groupId, expId);
      toast.success('Expense deleted');
      load();
    } catch {
      toast.error('Failed to delete expense');
    }
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!memberEmail.trim()) { toast.error('Email is required'); return; }
    setSubmittingMem(true);
    try {
      await addMember(groupId, { email: memberEmail });
      toast.success('Member added!');
      setShowMemForm(false);
      setMemberEmail('');
      load();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to add member');
    } finally {
      setSubmittingMem(false);
    }
  };

  const handleMarkSettled = async (splitId) => {
    try {
      await markSettled(groupId, splitId);
      toast.success('Marked as settled');
      load();
    } catch {
      toast.error('Failed to mark settled');
    }
  };

  const handleLogout = () => { logout(); navigate('/login'); };

  if (loading) return <div style={s.center}>Loading...</div>;
  if (!group)  return <div style={s.center}>Group not found.</div>;

  return (
    <div>
      <Navbar/>

      <PageWrapper>
        {/* Group header */}
        <div style={s.groupHeader}>
          <div style={s.groupAvatar}>{group.name.charAt(0).toUpperCase()}</div>
          <div>
            <h2 style={s.groupName}>{group.name}</h2>
            {group.description && <p style={s.groupDesc}>{group.description}</p>}
            <p style={s.groupMeta}>
              {group.members.length} members · Created by {group.createdBy.name}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={s.tabs}>
          {TABS.map(tab => (
            <button key={tab} style={{
              ...s.tab,
              ...(activeTab === tab ? s.tabActive : {})
            }} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {/* ── Expenses tab ──────────────────────────── */}
        {activeTab === 'Expenses' && (
          <div>
            <div style={s.tabHeader}>
              <span style={s.tabCount}>{expenses.length} expenses</span>
              <button style={s.addBtn} onClick={() => setShowExpForm(true)}>
                + Add expense
              </button>
            </div>

            {expenses.length === 0 ? (
              <div style={s.empty}>No expenses yet.</div>
            ) : (
              <div style={s.list}>
                {expenses.map(exp => (
                  <div key={exp.id} style={s.expCard}>
                    <div style={s.expTop}>
                      <div>
                        <div style={s.expDesc}>{exp.description}</div>
                        <div style={s.expMeta}>
                          Paid by {exp.paidBy.name} · {formatDate(exp.date)} · {exp.splitType}
                        </div>
                      </div>
                      <div style={s.expRight}>
                        <div style={s.expAmt}>
                          ₹{Number(exp.amount).toLocaleString('en-IN')}
                        </div>
                        {(exp.paidBy.email === user?.email ||
                          group.createdBy.email === user?.email) && (
                          <button style={s.delBtn}
                            onClick={() => handleDeleteExpense(exp.id)}>
                            Delete
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Split breakdown */}
                    <div style={s.splits}>
                      {exp.splits.map(split => (
                        <div key={split.userId} style={s.splitRow}>
                          <div style={s.splitName}>{split.userName}</div>
                          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                            <span style={s.splitAmt}>
                              ₹{Number(split.shareAmount).toLocaleString('en-IN')}
                            </span>
                            {split.settled ? (
                              <span style={s.settledBadge}>Settled</span>
                            ) : (
                              <span style={s.unsettledBadge}>Unsettled</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Balances tab ──────────────────────────── */}
        {activeTab === 'Balances' && balances && (
          <div>
            <h3 style={s.subheading}>Who owes whom</h3>
            {balances.suggestions.length === 0 ? (
              <div style={s.empty}>All settled up! 🎉</div>
            ) : (
              <div style={s.list}>
                {balances.suggestions.map((sug, i) => (
                  <div key={i} style={s.sugCard}>
                    <div style={s.sugText}>
                      <span style={s.sugName}>{sug.fromUserName}</span>
                      <span style={s.sugArrow}> owes </span>
                      <span style={s.sugName}>{sug.toUserName}</span>
                    </div>
                    <div style={s.sugAmt}>
                      ₹{Number(sug.amount).toLocaleString('en-IN')}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <h3 style={{ ...s.subheading, marginTop: 24 }}>Net balances</h3>
            <div style={s.list}>
              {balances.balances.map(b => (
                <div key={b.userId} style={s.balCard}>
                  <span style={s.balName}>{b.userName}</span>
                  <span style={{
                    ...s.balAmt,
                    color: Number(b.netBalance) >= 0 ? '#16a34a' : '#ef4444'
                  }}>
                    {Number(b.netBalance) >= 0 ? '+' : ''}
                    ₹{Number(b.netBalance).toLocaleString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Members tab ───────────────────────────── */}
        {activeTab === 'Members' && (
          <div>
            <div style={s.tabHeader}>
              <span style={s.tabCount}>{group.members.length} members</span>
              <button style={s.addBtn} onClick={() => setShowMemForm(true)}>
                + Add member
              </button>
            </div>

            <div style={s.list}>
              {group.members.map(m => (
                <div key={m.id} style={s.memberRow}>
                  <div style={s.memberAvatar}>
                    {m.name.charAt(0).toUpperCase()}
                  </div>
                  <div style={s.memberInfo}>
                    <div style={s.memberName}>{m.name}
                      {m.email === user?.email && (
                        <span style={s.youBadge}>You</span>
                      )}
                      {m.id === group.createdBy.id && (
                        <span style={s.adminBadge}>Admin</span>
                      )}
                    </div>
                    <div style={s.memberEmail}>{m.email}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </PageWrapper>

      {/* Add expense modal */}
      {showExpForm && (
        <div style={s.overlay} onClick={() => setShowExpForm(false)}>
            <div style={{ ...s.modal, maxWidth: 480 }} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Add group expense</h3>
            <form onSubmit={handleAddExpense}>
                <label style={s.label}>Amount (₹)</label>
                <input style={s.input} type="number" step="0.01" min="0.01"
                placeholder="0.00" value={expForm.amount}
                onChange={e => {
                    const amt = e.target.value;
                    setExpForm(f => ({ ...f, amount: amt }));
                    // auto-distribute equally when amount changes in EQUAL mode
                    if (expForm.splitType === 'EQUAL') return;
                    redistributeEqual(amt, group.members);
                }} />

                <label style={s.label}>Description</label>
                <input style={s.input} type="text" placeholder="e.g. Hotel booking"
                value={expForm.description}
                onChange={e => setExpForm(f => ({ ...f, description: e.target.value }))} />

                <label style={s.label}>Date</label>
                <input style={s.input} type="date" value={expForm.date}
                onChange={e => setExpForm(f => ({ ...f, date: e.target.value }))} />

                <label style={s.label}>Split type</label>
                <select style={s.input} value={expForm.splitType}
                onChange={e => {
                    const type = e.target.value;
                    setExpForm(f => ({ ...f, splitType: type }));
                    if (type === 'EQUAL') {
                    setCustomSplits({});
                    } else {
                    // Pre-fill equal amounts as starting point
                    if (expForm.amount && group) {
                        const share = (parseFloat(expForm.amount) / group.members.length).toFixed(2);
                        const init  = {};
                        group.members.forEach(m => { init[m.id] = share; });
                        setCustomSplits(init);
                    }
                    }
                }}>
                <option value="EQUAL">Equal split</option>
                <option value="CUSTOM">Custom split</option>
                </select>

                {/* Custom split inputs */}
                {expForm.splitType === 'CUSTOM' && group && (
                <div style={{ marginTop: 12 }}>
                    <div style={{ fontSize: 12, color: '#9ca3af', marginBottom: 8 }}>
                    Assign amount per member. Total must equal the expense amount.
                    </div>
                    {group.members.map(m => (
                    <div key={m.id} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:8 }}>
                        <div style={{ flex:1, fontSize:13, color:'#374151' }}>
                        {m.name}
                        {m.email === user?.email && (
                            <span style={{ fontSize:10, color:'#534AB7', marginLeft:5 }}>(you)</span>
                        )}
                        </div>
                        <input
                        style={{ ...s.input, width:120 }}
                        type="number" step="0.01" min="0"
                        placeholder="0.00"
                        value={customSplits[m.id] || ''}
                        onChange={e => setCustomSplits(prev => ({
                            ...prev, [m.id]: e.target.value
                        }))}
                        />
                    </div>
                    ))}
                    {/* Running total validation */}
                    {(() => {
                    const total  = Object.values(customSplits)
                        .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);
                    const target = parseFloat(expForm.amount) || 0;
                    const diff   = Math.abs(total - target);
                    return diff > 0.01 ? (
                        <div style={{ fontSize:12, color:'#ef4444', marginTop:4 }}>
                        Total assigned: ₹{total.toFixed(2)} — must equal ₹{target.toFixed(2)}
                        </div>
                    ) : total > 0 ? (
                        <div style={{ fontSize:12, color:'#16a34a', marginTop:4 }}>
                        ✓ Total matches
                        </div>
                    ) : null;
                    })()}
                </div>
                )}

                <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button type="submit" style={s.addBtn} disabled={submittingExp}>
                    {submittingExp ? 'Adding...' : 'Add expense'}
                </button>
                <button type="button" style={s.cancelBtn}
                    onClick={() => setShowExpForm(false)}>Cancel</button>
                </div>
            </form>
            </div>
        </div>
        )}

      {/* Add member modal */}
      {showMemForm && (
        <div style={s.overlay} onClick={() => setShowMemForm(false)}>
          <div style={s.modal} onClick={e => e.stopPropagation()}>
            <h3 style={s.modalTitle}>Add member</h3>
            <p style={{ fontSize:13, color:'#9ca3af', marginBottom:12 }}>
              They must already have a FinSplit account.
            </p>
            <form onSubmit={handleAddMember}>
              <label style={s.label}>Email address</label>
              <input style={s.input} type="email" placeholder="friend@example.com"
                value={memberEmail}
                onChange={e => setMemberEmail(e.target.value)} />

              <div style={{ display:'flex', gap:10, marginTop:16 }}>
                <button type="submit" style={s.addBtn} disabled={submittingMem}>
                  {submittingMem ? 'Adding...' : 'Add member'}
                </button>
                <button type="button" style={s.cancelBtn}
                  onClick={() => setShowMemForm(false)}>Cancel</button>
              </div>
            </form>
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
  navLink: { fontSize:'0.875rem', color:'#6b7280', cursor:'pointer' },
  logoutBtn: { padding:'0.4rem 0.9rem', background:'transparent', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer', color:'#374151' },
  page: { maxWidth:860, margin:'2rem auto', padding:'0 1.5rem' },
  groupHeader: { display:'flex', alignItems:'center', gap:16, marginBottom:24 },
  groupAvatar: { width:52, height:52, borderRadius:'50%', background:'#EEEDFE', color:'#534AB7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'1.3rem', fontWeight:600, flexShrink:0 },
  groupName: { fontSize:'1.2rem', fontWeight:600, color:'#111827' },
  groupDesc: { fontSize:'0.875rem', color:'#6b7280', marginTop:2 },
  groupMeta: { fontSize:'0.8rem', color:'#9ca3af', marginTop:4 },
  tabs: { display:'flex', gap:4, borderBottom:'1px solid #e5e7eb', marginBottom:20 },
  tab: { padding:'0.6rem 1rem', background:'transparent', border:'none', borderBottom:'2px solid transparent', fontSize:'0.875rem', color:'#6b7280', cursor:'pointer', marginBottom:-1 },
  tabActive: { color:'#6366f1', borderBottomColor:'#6366f1', fontWeight:500 },
  tabHeader: { display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 },
  tabCount: { fontSize:'0.875rem', color:'#9ca3af' },
  subheading: { fontSize:'0.9rem', fontWeight:500, color:'#374151', marginBottom:10 },
  addBtn: { padding:'0.48rem 1rem', background:'#6366f1', color:'#fff', border:'none', borderRadius:8, fontSize:'0.875rem', fontWeight:500, cursor:'pointer' },
  cancelBtn: { padding:'0.48rem 1rem', background:'transparent', color:'#374151', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', cursor:'pointer' },
  list: { display:'flex', flexDirection:'column', gap:8 },
  expCard: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'1rem 1.25rem' },
  expTop: { display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:10 },
  expDesc: { fontSize:'0.9rem', fontWeight:500, color:'#111827' },
  expMeta: { fontSize:'0.78rem', color:'#9ca3af', marginTop:2 },
  expRight: { textAlign:'right' },
  expAmt: { fontSize:'1rem', fontWeight:600, color:'#111827' },
  delBtn: { fontSize:'0.75rem', color:'#ef4444', background:'transparent', border:'1px solid #fca5a5', borderRadius:6, padding:'2px 8px', cursor:'pointer', marginTop:4 },
  splits: { borderTop:'1px solid #f3f4f6', paddingTop:8, display:'flex', flexDirection:'column', gap:4 },
  splitRow: { display:'flex', justifyContent:'space-between', alignItems:'center' },
  splitName: { fontSize:'0.8rem', color:'#6b7280' },
  splitAmt: { fontSize:'0.8rem', fontWeight:500, color:'#374151' },
  settledBadge: { fontSize:10, padding:'1px 7px', borderRadius:20, background:'#f0fdf4', color:'#16a34a' },
  unsettledBadge: { fontSize:10, padding:'1px 7px', borderRadius:20, background:'#fef2f2', color:'#ef4444' },
  sugCard: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'0.85rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  sugText: { fontSize:'0.9rem' },
  sugName: { fontWeight:500, color:'#111827' },
  sugArrow: { color:'#9ca3af' },
  sugAmt: { fontSize:'1rem', fontWeight:600, color:'#374151' },
  balCard: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'0.85rem 1.25rem', display:'flex', justifyContent:'space-between', alignItems:'center' },
  balName: { fontSize:'0.9rem', color:'#374151' },
  balAmt: { fontSize:'0.95rem', fontWeight:600 },
  memberRow: { background:'#fff', border:'1px solid #e5e7eb', borderRadius:10, padding:'0.85rem 1.25rem', display:'flex', alignItems:'center', gap:12 },
  memberAvatar: { width:38, height:38, borderRadius:'50%', background:'#EEEDFE', color:'#534AB7', display:'flex', alignItems:'center', justifyContent:'center', fontSize:'0.95rem', fontWeight:600, flexShrink:0 },
  memberInfo: { flex:1 },
  memberName: { fontSize:'0.9rem', fontWeight:500, color:'#111827', display:'flex', alignItems:'center', gap:6 },
  memberEmail: { fontSize:'0.78rem', color:'#9ca3af', marginTop:1 },
  youBadge: { fontSize:10, padding:'1px 7px', borderRadius:20, background:'#EEEDFE', color:'#534AB7' },
  adminBadge: { fontSize:10, padding:'1px 7px', borderRadius:20, background:'#faeeda', color:'#633806' },
  empty: { textAlign:'center', padding:'2.5rem', color:'#9ca3af', fontSize:'0.9rem' },
  overlay: { position:'fixed', inset:0, background:'rgba(0,0,0,0.35)', display:'flex', alignItems:'center', justifyContent:'center', zIndex:50 },
  modal: { background:'#fff', borderRadius:12, padding:'1.75rem 2rem', width:'100%', maxWidth:420 },
  modalTitle: { fontSize:'1rem', fontWeight:600, color:'#111827', marginBottom:16 },
  label: { display:'block', fontSize:'0.875rem', fontWeight:500, color:'#374151', marginBottom:4, marginTop:12 },
  input: { width:'100%', padding:'0.55rem 0.85rem', border:'1px solid #d1d5db', borderRadius:8, fontSize:'0.875rem', color:'#111827', outline:'none', background:'#fff' },
  center: { display:'flex', justifyContent:'center', marginTop:'4rem', color:'#9ca3af', fontSize:14 },
};