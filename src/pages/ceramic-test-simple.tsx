import React, { useState, useEffect } from 'react';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { 
  DataType, 
  initCeramic, 
  checkCollectionExists, 
  createCollection, 
  createRecord, 
  getRecords,
  clearCollection
} from '../utils/ceramicUtils';

// Interface for medical data
interface MedicalData {
  parameter: string;
  value: string;
  unit: string;
  date: string;
  referenceRange?: string;
  notes?: string;
}

// Interface for grouped medical data
interface GroupedMedicalData {
  [parameter: string]: MedicalData[];
}

const CeramicTestPage: React.FC = () => {
  // State variables
  const [address, setAddress] = useState<string>('');
  const [ceramic, setCeramic] = useState<CeramicClient | null>(null);
  const [collectionId, setCollectionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isInitializing, setIsInitializing] = useState<boolean>(false);
  const [medicalData, setMedicalData] = useState<MedicalData[]>([]);
  const [groupedData, setGroupedData] = useState<GroupedMedicalData>({});
  
  // Form state
  const [parameter, setParameter] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [unit, setUnit] = useState<string>('');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceRange, setReferenceRange] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  
  // Connect wallet
  const connectWallet = async () => {
    if (typeof window !== 'undefined' && window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        if (accounts && accounts.length > 0) {
          setAddress(accounts[0]);
        }
      } catch (error) {
        console.error('Error connecting wallet:', error);
      }
    } else {
      alert('Please install MetaMask or another Ethereum wallet');
    }
  };
  
  // Disconnect wallet
  const disconnectWallet = () => {
    setAddress('');
    setCeramic(null);
    setCollectionId('');
    setMedicalData([]);
    setGroupedData({});
  };
  
  // Initialize Ceramic when the address changes
  useEffect(() => {
    if (address && typeof window !== 'undefined' && window.ethereum) {
      initializeCeramic();
    }
  }, [address]);
  
  // Group medical data by parameter
  useEffect(() => {
    const grouped = medicalData.reduce((acc, data) => {
      if (!acc[data.parameter]) {
        acc[data.parameter] = [];
      }
      acc[data.parameter].push(data);
      return acc;
    }, {} as GroupedMedicalData);
    
    // Sort each group by date (newest first)
    Object.keys(grouped).forEach(parameter => {
      grouped[parameter].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });
    
    setGroupedData(grouped);
  }, [medicalData]);
  
  // Initialize Ceramic and load medical data
  const initializeCeramic = async () => {
    if (!address || !window.ethereum) {
      alert('Please connect your wallet first');
      return;
    }
    
    setIsInitializing(true);
    
    try {
      // Initialize Ceramic client
      const { ceramic: ceramicClient } = await initCeramic(window.ethereum, address);
      setCeramic(ceramicClient);
      
      // Check if medical collection exists
      const did = ceramicClient.did?.id;
      if (!did) {
        throw new Error('No DID available');
      }
      
      const { exists, collectionId: medicalCollectionId } = await checkCollectionExists(
        ceramicClient,
        DataType.MEDICAL,
        did
      );
      
      // Create collection if it doesn't exist
      if (!exists) {
        const { collectionId: newCollectionId } = await createCollection(
          ceramicClient,
          DataType.MEDICAL,
          did
        );
        setCollectionId(newCollectionId);
      } else {
        setCollectionId(medicalCollectionId);
        // Load existing medical data
        await loadMedicalData(ceramicClient, medicalCollectionId);
      }
      
      alert('Successfully connected to Ceramic');
    } catch (error) {
      console.error('Error initializing Ceramic:', error);
      alert('Failed to initialize Ceramic');
    } finally {
      setIsInitializing(false);
    }
  };
  
  // Load medical data from Ceramic
  const loadMedicalData = async (ceramicClient: CeramicClient, medicalCollectionId: string) => {
    setIsLoading(true);
    
    try {
      const records = await getRecords(ceramicClient, DataType.MEDICAL, medicalCollectionId);
      
      // Convert Ceramic records to MedicalData format
      const medicalDataArray = records.map(record => {
        return record.content as MedicalData;
      });
      
      setMedicalData(medicalDataArray);
      
      alert(`Loaded ${medicalDataArray.length} medical records`);
    } catch (error) {
      console.error('Error loading medical data:', error);
      alert('Failed to load medical data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add new medical data
  const handleAddMedicalData = async () => {
    if (!ceramic || !collectionId) {
      alert('Ceramic not initialized');
      return;
    }
    
    if (!parameter || !value || !unit || !date) {
      alert('Please fill in all required fields');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Create the medical data object
      const newMedicalData: MedicalData = {
        parameter,
        value,
        unit,
        date,
        referenceRange,
        notes,
      };
      
      // Create a new record in Ceramic
      await createRecord(
        ceramic,
        DataType.MEDICAL,
        collectionId,
        newMedicalData,
        ['medical', parameter.toLowerCase().replace(/\s+/g, '-')]
      );
      
      // Update local state
      setMedicalData([...medicalData, newMedicalData]);
      
      // Reset form
      setParameter('');
      setValue('');
      setUnit('');
      setDate(new Date().toISOString().split('T')[0]);
      setReferenceRange('');
      setNotes('');
      
      alert('Medical data added successfully');
    } catch (error) {
      console.error('Error adding medical data:', error);
      alert('Failed to add medical data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh medical data
  const handleRefreshData = async () => {
    if (!ceramic || !collectionId) {
      alert('Ceramic not initialized');
      return;
    }
    
    await loadMedicalData(ceramic, collectionId);
  };
  
  // Clear all medical data
  const handleClearAllData = async () => {
    if (!ceramic || !collectionId) {
      alert('Ceramic not initialized');
      return;
    }
    
    if (!window.confirm('Are you sure you want to clear all medical data? This action cannot be undone.')) {
      return;
    }
    
    setIsLoading(true);
    
    try {
      await clearCollection(ceramic, DataType.MEDICAL, collectionId);
      
      // Clear local state
      setMedicalData([]);
      setGroupedData({});
      
      alert('All medical data cleared successfully');
    } catch (error) {
      console.error('Error clearing medical data:', error);
      alert('Failed to clear medical data');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render the component
  return (
    <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '20px' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '20px' }}>Ceramic Integration Test</h1>
      <p style={{ marginBottom: '20px' }}>This page demonstrates the new Ceramic integration for wot.id</p>
      
      <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', marginBottom: '10px' }}>Wallet Connection</h2>
        
        {address ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p>Connected: <strong>{address}</strong></p>
            <button 
              onClick={disconnectWallet}
              style={{ 
                padding: '8px 16px', 
                backgroundColor: '#f44336', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer' 
              }}
            >
              Disconnect
            </button>
          </div>
        ) : (
          <button 
            onClick={connectWallet}
            style={{ 
              padding: '8px 16px', 
              backgroundColor: '#2196f3', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px', 
              cursor: 'pointer' 
            }}
          >
            Connect Wallet
          </button>
        )}
      </div>
      
      {address && (
        <div style={{ padding: '20px', border: '1px solid #ccc', borderRadius: '8px' }}>
          <h2 style={{ fontSize: '20px', marginBottom: '20px' }}>Medical Data</h2>
          
          {isInitializing ? (
            <div style={{ textAlign: 'center', padding: '40px 0' }}>
              <p>Initializing Ceramic...</p>
            </div>
          ) : (
            <>
              {/* Add new medical data form */}
              <div style={{ marginBottom: '30px', padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                <h3 style={{ fontSize: '16px', marginBottom: '15px' }}>Add New Medical Data</h3>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Parameter*</label>
                  <input 
                    type="text" 
                    value={parameter} 
                    onChange={(e) => setParameter(e.target.value)} 
                    placeholder="e.g. Glucose" 
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                
                <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Value*</label>
                    <input 
                      type="text" 
                      value={value} 
                      onChange={(e) => setValue(e.target.value)} 
                      placeholder="e.g. 120" 
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                  
                  <div style={{ flex: 1 }}>
                    <label style={{ display: 'block', marginBottom: '5px' }}>Unit*</label>
                    <input 
                      type="text" 
                      value={unit} 
                      onChange={(e) => setUnit(e.target.value)} 
                      placeholder="e.g. mg/dL" 
                      style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                    />
                  </div>
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Date*</label>
                  <input 
                    type="date" 
                    value={date} 
                    onChange={(e) => setDate(e.target.value)}
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Reference Range</label>
                  <input 
                    type="text" 
                    value={referenceRange} 
                    onChange={(e) => setReferenceRange(e.target.value)} 
                    placeholder="e.g. 70-99 mg/dL" 
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                
                <div style={{ marginBottom: '15px' }}>
                  <label style={{ display: 'block', marginBottom: '5px' }}>Notes</label>
                  <input 
                    type="text" 
                    value={notes} 
                    onChange={(e) => setNotes(e.target.value)} 
                    placeholder="Any additional notes" 
                    style={{ width: '100%', padding: '8px', border: '1px solid #ccc', borderRadius: '4px' }}
                  />
                </div>
                
                <button 
                  onClick={handleAddMedicalData} 
                  disabled={isLoading}
                  style={{ 
                    padding: '8px 16px', 
                    backgroundColor: '#2196f3', 
                    color: 'white', 
                    border: 'none', 
                    borderRadius: '4px', 
                    cursor: isLoading ? 'not-allowed' : 'pointer',
                    opacity: isLoading ? 0.7 : 1
                  }}
                >
                  {isLoading ? 'Adding...' : 'Add Medical Data'}
                </button>
              </div>
              
              {/* Display medical data */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
                  <h3 style={{ fontSize: '16px' }}>Your Medical Data</h3>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button 
                      onClick={handleRefreshData} 
                      disabled={isLoading}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: 'transparent', 
                        color: '#2196f3', 
                        border: '1px solid #2196f3', 
                        borderRadius: '4px', 
                        cursor: isLoading ? 'not-allowed' : 'pointer'
                      }}
                    >
                      {isLoading ? 'Refreshing...' : 'Refresh Data'}
                    </button>
                    <button 
                      onClick={handleClearAllData}
                      disabled={isLoading || Object.keys(groupedData).length === 0}
                      style={{ 
                        padding: '8px 16px', 
                        backgroundColor: 'transparent', 
                        color: '#f44336', 
                        border: '1px solid #f44336', 
                        borderRadius: '4px', 
                        cursor: (isLoading || Object.keys(groupedData).length === 0) ? 'not-allowed' : 'pointer',
                        opacity: (isLoading || Object.keys(groupedData).length === 0) ? 0.7 : 1
                      }}
                    >
                      Clear All Data
                    </button>
                  </div>
                </div>
                
                {isLoading ? (
                  <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <p>Loading medical data...</p>
                  </div>
                ) : Object.keys(groupedData).length === 0 ? (
                  <div style={{ padding: '15px', backgroundColor: '#e3f2fd', borderRadius: '4px' }}>
                    <p>No data yet! Add your first medical data point above.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {Object.entries(groupedData).map(([parameter, dataPoints]) => (
                      <div key={parameter} style={{ padding: '15px', border: '1px solid #eee', borderRadius: '8px' }}>
                        <h4 style={{ fontSize: '14px', marginBottom: '10px' }}>{parameter}</h4>
                        
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {dataPoints.map((data, index) => (
                            <div key={index} style={{ padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                <p style={{ fontWeight: 'bold' }}>
                                  {data.value} {data.unit}
                                </p>
                                <p style={{ fontSize: '12px', color: '#757575' }}>
                                  {new Date(data.date).toLocaleDateString()}
                                </p>
                              </div>
                              
                              {data.referenceRange && (
                                <p style={{ fontSize: '12px' }}>
                                  Reference Range: {data.referenceRange}
                                </p>
                              )}
                              
                              {data.notes && (
                                <p style={{ fontSize: '12px', fontStyle: 'italic' }}>
                                  Notes: {data.notes}
                                </p>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CeramicTestPage;
