export default function LoadingSpinner({ center = true, size = 'md' }) {
  const cls = size === 'lg' ? 'spinner spinner-lg' : 'spinner'
  if (center) return <div className="spinner-center"><div className={cls} /></div>
  return <div className={cls} />
}
