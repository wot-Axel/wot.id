'use client';

import React from 'react';
import { useAppKitAccount } from '@reown/appkit/react';
import { formatEther } from 'viem';
import { useBalance } from 'wagmi';

export const CurrenciesSection = () => {
  const { address, isConnected } = useAppKitAccount();
  
  // Fetch the user's ETH balance
  const { data: ethBalanceData, isLoading, isError } = useBalance({
    address: address as `0x${string}`,
  });

  if (!isConnected) {
    return null;
  }

  return (
    <div className="legal-section">
      <h2>My Currencies</h2>
      <div className="section-content">
        {isLoading ? (
          <p>Loading your ETH balance...</p>
        ) : isError ? (
          <p>Error loading your ETH balance. Please refresh the page.</p>
        ) : (
          <div>
            <div className="portfolio-summary" style={{ 
              marginBottom: '1.5rem', 
              padding: '1rem', 
              backgroundColor: '#f9f9f9', 
              borderRadius: '8px',
              border: '1px solid #eaeaea'
            }}>
              <h3 style={{ marginTop: 0 }}>Ethereum Balance</h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
                    <strong>ETH (Ξ)</strong>
                  </p>
                  <p style={{ fontSize: '0.9rem', margin: '0.5rem 0' }}>
                    <strong>Network:</strong> Ethereum
                  </p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: '1.8rem', fontWeight: 'bold', margin: '0' }}>
                    {ethBalanceData ? parseFloat(formatEther(ethBalanceData.value)).toFixed(6) : '0'} ETH
                  </p>
                  {ethBalanceData && (
                    <p style={{ fontSize: '0.8rem', color: '#666', margin: '0' }}>
                      ≈ ${(parseFloat(formatEther(ethBalanceData.value)) * 3500).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  )}
                </div>
              </div>
            </div>
            
            <div className="currency-table" style={{ marginTop: '1rem' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ backgroundColor: '#f0f0f0' }}>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Asset</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Name</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Amount</th>
                    <th style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>Value (USD)</th>
                    <th style={{ padding: '0.75rem', textAlign: 'left', borderBottom: '1px solid #ddd' }}>Network</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ backgroundColor: 'white' }}>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>
                      <div style={{ display: 'flex', alignItems: 'center' }}>
                        <span style={{ 
                          display: 'inline-block',
                          width: '30px',
                          height: '30px',
                          borderRadius: '50%',
                          backgroundColor: '#627eea',
                          color: 'white',
                          textAlign: 'center',
                          lineHeight: '30px',
                          marginRight: '10px',
                          fontWeight: 'bold'
                        }}>Ξ</span>
                        <span>ETH</span>
                      </div>
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Ethereum</td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                      {ethBalanceData ? parseFloat(formatEther(ethBalanceData.value)).toFixed(6) : '0'}
                    </td>
                    <td style={{ padding: '0.75rem', textAlign: 'right', borderBottom: '1px solid #ddd' }}>
                      ${ethBalanceData ? (parseFloat(formatEther(ethBalanceData.value)) * 3500).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                    </td>
                    <td style={{ padding: '0.75rem', borderBottom: '1px solid #ddd' }}>Ethereum</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <p style={{ fontSize: '0.8rem', color: '#666', marginTop: '1rem' }}>
              * ETH price estimated at $3,500 USD. Actual value may vary based on current market prices.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
