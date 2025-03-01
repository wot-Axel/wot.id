//'use client'

import { useReadContract } from 'wagmi'
import { wagmiContractConfig } from './contracts'

export default function ReadContract() {
  const { data: balance } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'balanceOf',
    args: ['0x7D78710570D65b17D860Dd6AC51ECa426cc8Ee9B'],
  })

  return (
    <div>Balance: {balance?.toString()}</div>
  )
}

