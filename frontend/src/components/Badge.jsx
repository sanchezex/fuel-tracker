import React from 'react'

export default function Badge({ tone = 'neutral', children }) {
  const className = `badge badge--${tone}`
  return <span className={className}>{children}</span>
}

