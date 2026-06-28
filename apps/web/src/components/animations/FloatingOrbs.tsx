export function FloatingOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Blue orb — bottom-left */}
      <div
        className="absolute w-[600px] h-[600px] rounded-full opacity-[0.06] animate-drift"
        style={{
          background: 'radial-gradient(circle, #0078D4 0%, transparent 70%)',
          bottom: '-200px',
          left: '-150px',
          animationDuration: '38s',
          animationDelay: '0s',
        }}
      />
      {/* Teal orb — top-right */}
      <div
        className="absolute w-[500px] h-[500px] rounded-full opacity-[0.05] animate-drift"
        style={{
          background: 'radial-gradient(circle, #00D4B8 0%, transparent 70%)',
          top: '-150px',
          right: '-100px',
          animationDuration: '45s',
          animationDelay: '-12s',
        }}
      />
      {/* Violet orb — center */}
      <div
        className="absolute w-[700px] h-[700px] rounded-full opacity-[0.03] animate-drift"
        style={{
          background: 'radial-gradient(circle, #8B7CF8 0%, transparent 70%)',
          top: '30%',
          left: '20%',
          animationDuration: '55s',
          animationDelay: '-25s',
        }}
      />
    </div>
  )
}
