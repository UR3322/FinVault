export function formatPKR(amount) {
  if (amount === null || amount === undefined) return 'PKR 0'
  return 'PKR ' + Number(amount).toLocaleString('en-PK', { minimumFractionDigits: 0 })
}

export function formatNumber(n) {
  return Number(n).toLocaleString('en-PK')
}
