// IPアドレスの包括判定計算
export function ip2Long(ip: string) {
  return parseInt(
    ip
      .split('.')
      .map(e => Number(e).toString(2).padStart(8, '0'))
      .join(''),
    2,
  )
}
// サブネットマスク付き IP アドレスの範囲計算
export function getIpAddressRange(address: string | null | undefined) {
  if (!address) {
    return { start: 0, end: 0 }
  }

  const [ip, prefix] = address.split('/')
  const prefixNum = Number(prefix)
  if (!ip || !Number.isInteger(prefixNum) || prefixNum < 0 || prefixNum > 32) {
    return { start: 0, end: 0 }
  }

  const ipNum = ip2Long(ip)
  if (Number.isNaN(ipNum)) {
    return { start: 0, end: 0 }
  }

  const mask = parseInt(String('').padStart(prefixNum, '1').padEnd(32, '0'), 2)
  const start = (ipNum & mask) >>> 0
  const end = (start | ~mask) >>> 0
  return { start, end }
}
// サブネットマスク付き IP アドレスの重複判定計算
export function isIpAddressDisjoint(targetAddress: string, forbiddenAddress: string) {
  const targetRange = getIpAddressRange(targetAddress)
  const forbiddenRange = getIpAddressRange(forbiddenAddress)
  return forbiddenRange.end < targetRange.start || targetRange.end < forbiddenRange.start
}

function cidrToSortKey(cidr: string) {
  if (!cidr) {
    return { ip: 0, mask: 0 }
  }

  const [ip, prefix] = cidr.split('/')
  const prefixNum = Number(prefix)
  if (!ip || !Number.isInteger(prefixNum) || prefixNum < 0 || prefixNum > 32) {
    return { ip: 0, mask: 0 }
  }

  const ipNum = ip2Long(ip)
  if (Number.isNaN(ipNum)) {
    return { ip: 0, mask: 0 }
  }
  return { ip: ipNum, mask: prefixNum }
}

export function cidrSort(cidrA: string, cidrB: string) {
  const sortKeyA = cidrToSortKey(cidrA)
  const sortKeyB = cidrToSortKey(cidrB)
  return sortKeyA.ip - sortKeyB.ip || sortKeyA.mask - sortKeyB.mask
}
