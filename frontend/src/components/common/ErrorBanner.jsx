import React from 'react'

export default function ErrorBanner({ message, onRetry }) {
  if (!message) return null
  return (
    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry && (
        <button onClick={onRetry} className="shrink-0 text-xs font-medium underline hover:text-red-800">
          Try again
        </button>
      )}
    </div>
  )
}
