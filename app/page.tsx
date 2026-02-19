export default function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-white dark:bg-[#131314] text-gray-900 dark:text-gray-100 font-[Inter] p-4 text-center animate-in fade-in zoom-in duration-700">
      <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-2xl flex items-center justify-center mb-6 text-blue-600 dark:text-blue-400">
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" /></svg>
      </div>
      <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">AI@IM Events</h1>
      <p className="text-lg text-gray-500 dark:text-gray-400 mb-8 max-w-md">
        Our new events portal is under construction. <br /> Something amazing is coming soon.
      </p>
      <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
        </span>
        Stay tuned for updates
      </div>
    </div>
  )
}
