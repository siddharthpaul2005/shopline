import React from 'react'

const variants = {
  success: 'bg-green-100 text-green-700',
  danger: 'bg-red-100 text-red-700',
  warning: 'bg-yellow-100 text-yellow-700',
  info: 'bg-blue-100 text-blue-700',
  gray: 'bg-gray-100 text-gray-600',
  purple: 'bg-purple-100 text-purple-700',
}

const statusMap = {
  active: 'success', approved: 'success', delivered: 'success', completed: 'success',
  pending: 'warning', processing: 'info', shipped: 'info',
  rejected: 'danger', cancelled: 'danger', inactive: 'danger',
  admin: 'purple', vendor: 'info', customer: 'gray',
}

export default function Badge({ text, variant }) {
  const v = variant || statusMap[text?.toLowerCase()] || 'gray'
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[v]}`}>
      {text}
    </span>
  )
}
