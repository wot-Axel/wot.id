'use client'

import { useReadContract } from 'wagmi'
import React from 'react'

import { wagmiContractConfig } from './contracts'

export default function ReadContract() {
  const { data: balance } = useReadContract({
    ...wagmiContractConfig,
    functionName: 'balanceOf',
    args: ['0xBBfB973B887DD339eC01E3335be71415e0f1D41b'],
  })

  return (
    <div>Balance: {balance?.toString()}</div>
  )
}

