function LeafIcon({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20 4C10 4 4 10 4 18v2h2c8 0 14-6 14-16V4z" fill="currentColor" />
    </svg>
  )
}

export default LeafIcon
