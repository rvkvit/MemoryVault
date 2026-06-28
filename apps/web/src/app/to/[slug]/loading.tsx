export default function Loading() {
  // Shown by Next.js Suspense while the server component streams.
  // The AILoadingScreen (client) takes over once data arrives.
  return (
    <div className="fixed inset-0 bg-space-black flex items-center justify-center" aria-label="Loading">
      <div className="w-6 h-6 rounded-full border-2 border-copilot-teal/30 border-t-copilot-teal animate-spin" />
    </div>
  )
}
