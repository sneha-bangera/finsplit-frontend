export default function PageWrapper({ children }) {
  return (
    <div style={{ maxWidth: 860, margin: '2rem auto', padding: '0 1.5rem' }}>
      {children}
    </div>
  );
}