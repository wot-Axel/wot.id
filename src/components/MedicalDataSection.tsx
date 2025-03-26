'use client';

import { useState, useEffect } from 'react';
import { useAppKitAccount, useAppKitNetwork } from '@reown/appkit/react';
import { optimism } from '@reown/appkit/networks';
import { 
  initTableland, 
  createMedicalTable, 
  insertMedicalData, 
  getMedicalData,
  checkMedicalTableExists,
  type PrivateData
} from '@/utils/tablelandUtils';
import { Database } from '@tableland/sdk';
import { MedicalDataTable } from './MedicalDataTable';

export const MedicalDataSection = () => {
  const { address, isConnected } = useAppKitAccount();
  const { switchNetwork } = useAppKitNetwork();
  const [isOptimismNetwork, setIsOptimismNetwork] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [db, setDb] = useState<Database | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [privateData, setPrivateData] = useState<PrivateData[]>([]);
  const [medicalDataSections, setMedicalDataSections] = useState<Record<string, PrivateData[]>>({});
  const [importedData, setImportedData] = useState<boolean>(false);

  // Check network and initialize Tableland
  useEffect(() => {
    if (isConnected && address) {
      // We'll assume we're on Optimism for the mock implementation
      setIsOptimismNetwork(true);
      initTablelandDb();
    }
  }, [isConnected, address]);

  // Function to switch to Optimism network
  const handleSwitchToOptimism = () => {
    switchNetwork(optimism);
    setIsOptimismNetwork(true);
  };

  const initTablelandDb = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Initialize Tableland
      const tablelandDb = await initTableland();
      setDb(tablelandDb);
      
      // Check if medical table exists
      const existingTable = await checkMedicalTableExists(tablelandDb, address as string);
      
      if (existingTable) {
        setTableName(existingTable);
        // Load existing data
        const data = await getMedicalData(tablelandDb, existingTable);
        setPrivateData(data);
        
        // Check if medical data is already imported
        const hasMedicalData = data.some(item => item.key.includes('|'));
        if (hasMedicalData) {
          setImportedData(true);
          organizeMedicalData(data);
        }
      }
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error initializing Tableland');
      setLoading(false);
    }
  };

  const handleCreateTable = async () => {
    if (!db || !address) return;
    
    try {
      setLoading(true);
      setError('');
      
      const name = await createMedicalTable(db, address);
      setTableName(name);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error creating medical table');
      setLoading(false);
    }
  };

  const organizeMedicalData = (data: PrivateData[]) => {
    const sections: Record<string, PrivateData[]> = {};
    
    data.forEach(item => {
      if (item.key.includes('|')) {
        const [section] = item.key.split('.');
        if (!sections[section]) {
          sections[section] = [];
        }
        sections[section].push(item);
      }
    });
    
    setMedicalDataSections(sections);
  };

  const handleImportMedicalData = async () => {
    if (!db || !tableName) return;
    
    try {
      setLoading(true);
      setError('');
      
      // Parse the CSV data
      const medicalData = parseMedicalData();
      
      // Store each data point in the medical table
      for (const section in medicalData) {
        for (const entry of medicalData[section]) {
          const key = `${section}.${entry.parameter}|${entry.date}`;
          const value = `${entry.unit}|${entry.referenceRange}|${entry.value}`;
          await insertMedicalData(db, tableName, key, value);
        }
      }
      
      // Refresh data
      const data = await getMedicalData(db, tableName);
      setPrivateData(data);
      organizeMedicalData(data);
      setImportedData(true);
      
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'Error importing medical data');
      setLoading(false);
    }
  };

  // Function to parse the medical data from the provided CSV
  const parseMedicalData = () => {
    // This is a hardcoded implementation based on the data provided
    const sections: Record<string, Array<{
      parameter: string;
      unit: string;
      referenceRange: string;
      date: string;
      value: string;
    }>> = {
      'Basic Blood Tests': [],
      'Kidney Function': [],
      'Electrolytes': [],
      'Lipid Profile': [],
      'Inflammation Markers': [],
      'Thyroid Function': [],
      'Blood Cell Count': [],
      'Immune Proteins': [],
      'COVID-19 Tests': [],
      'Additional Values': [],
      'Urinalysis': []
    };
    
    // Basic Blood Tests
    const dates = ['09.11.2023', '14.11.2022', '14.10.2021', '11.02.2021'];
    
    // Basic Blood Tests
    addDataToSection('Basic Blood Tests', 'CK', 'U/l', '< 174', dates, ['77', '148', '95', '51']);
    addDataToSection('Basic Blood Tests', 'Troponin T', 'ng/ml', '< 14.0', dates, ['9.0', '10.6', '7.2', '5.4']);
    addDataToSection('Basic Blood Tests', 'NT-proBNP', 'pg/ml', '< 125', dates, ['108', '66.2', '56', '68.3']);
    addDataToSection('Basic Blood Tests', 'AP', 'U/l', '40 - 130', dates, ['67', '66', '56', '50']);
    addDataToSection('Basic Blood Tests', 'GGT', 'U/l', '< 71', dates, ['11', '14', '13', '13']);
    addDataToSection('Basic Blood Tests', 'GOT', 'U/l', '< 50', dates, ['29', '28', '27', '20']);
    addDataToSection('Basic Blood Tests', 'GPT', 'U/l', '< 50', dates, ['33', '26', '24', '26']);
    addDataToSection('Basic Blood Tests', 'Bilirubin gesamt', 'mg/dl', '< 1.2', dates, ['0.5', '0.6', '0.4', '0.5']);
    addDataToSection('Basic Blood Tests', 'Amylase', 'U/l', '28 - 100', dates, ['69', '90', '98', '75']);
    addDataToSection('Basic Blood Tests', 'Lipase', 'U/l', '< 60', dates, ['35', '56', '46', '37']);
    
    // Kidney Function
    addDataToSection('Kidney Function', 'Kreatinin', 'mg/dl', '< 1.17', dates, ['0.95', '1.07', '1.02', '1.06']);
    addDataToSection('Kidney Function', 'GFR Cystatin', 'ml/min', '> 60.0', dates, ['69.8', '70.1', '70.1', '73.5']);
    addDataToSection('Kidney Function', 'Harnstoff', 'mg/dl', '3.4 - 7.0', dates, ['5.2', '7.8', '5.7', '5.6']);
    
    // Electrolytes
    addDataToSection('Electrolytes', 'Kalium', 'mmol/l', '3.5 - 5.1', dates, ['5.1', '4.8', '5.0', '4.9']);
    addDataToSection('Electrolytes', 'Natrium', 'mmol/l', '136 - 145', dates, ['137', '138', '141', '140']);
    addDataToSection('Electrolytes', 'Calcium', 'mmol/l', '2.10 - 2.60', dates, ['2.34', '2.39', '2.37', '2.41']);
    
    // Lipid Profile
    addDataToSection('Lipid Profile', 'Blutzucker (BZ)', 'mg/dl', '70-140', dates, ['86', '81', '87', '87']);
    addDataToSection('Lipid Profile', 'HbA1c', '%', '< 6.5', dates, ['5.2', '5.3', '5.3', '5.3']);
    addDataToSection('Lipid Profile', 'LDL', 'mg/dl', '< 50', dates, ['31', '41', '44', '36']);
    addDataToSection('Lipid Profile', 'HDL', 'mg/dl', '> 40', dates, ['60', '56', '65', '67']);
    addDataToSection('Lipid Profile', 'Triglyceride', 'mg/dl', '< 200', dates, ['135', '155', '92', '66']);
    addDataToSection('Lipid Profile', 'Cholesterin', 'mg/dl', '< 200', dates, ['105', '-', '-', '-']);
    
    // Inflammation Markers
    addDataToSection('Inflammation Markers', 'CRP', 'mg/l', '< 5.0', dates, ['<0.6', '<0.6', '<0.6', '<0.6']);
    addDataToSection('Inflammation Markers', 'BSG', 'mm/h', '< 20', dates, ['2', '2', '2', '2']);
    
    // Thyroid Function
    addDataToSection('Thyroid Function', 'TSH basal', 'mU/l', '0.27 - 4.2', dates, ['2.43', '2.280', '2.140', '2.230']);
    addDataToSection('Thyroid Function', 'T3 frei', 'pg/ml', '2.0 - 4.4', dates, ['3.20', '3.1', '3.2', '3.3']);
    addDataToSection('Thyroid Function', 'T4 frei', 'pg/ml', '9.3 - 17.0', dates, ['12.9', '11.8', '12.0', '14.9']);
    
    // Blood Cell Count
    addDataToSection('Blood Cell Count', 'Hämoglobin', 'g/dl', '13.5 - 17.2', dates, ['14.6', '15.4', '15.5', '15.3']);
    addDataToSection('Blood Cell Count', 'Erythrozyten', 'T/l', '4.30 - 5.75', dates, ['4.56', '4.95', '4.94', '4.87']);
    addDataToSection('Blood Cell Count', 'Leukozyten', 'g/l', '3.6 - 10.2', dates, ['4.2', '4.2', '5.0', '5.1']);
    addDataToSection('Blood Cell Count', 'Hämatokrit', '%', '39.5 - 50.5', dates, ['40.9', '44.9', '44.8', '44.0']);
    addDataToSection('Blood Cell Count', 'MCV', 'fl', '80.0 - 99.0', dates, ['89.7', '90.7', '90.7', '90.3']);
    addDataToSection('Blood Cell Count', 'Thrombozyten', 'g/l', '150 - 370', dates, ['180', '180', '204', '207']);
    
    // Immune Proteins
    addDataToSection('Immune Proteins', 'Gesamt Eiweiß', 'g/dl', '6.2 - 8.3', dates, ['6.6', '7.0', '6.7', '6.6']);
    addDataToSection('Immune Proteins', 'Albumin', '%', '55.8 - 66.1', dates, ['63.6', '63.7', '64.4', '64.1']);
    addDataToSection('Immune Proteins', 'Alpha1', '%', '2.9 - 4.9', dates, ['4.0', '3.8', '4.0', '4.5']);
    addDataToSection('Immune Proteins', 'Alpha2', '%', '7.1 - 11.8', dates, ['8.6', '8.7', '8.1', '8.0']);
    addDataToSection('Immune Proteins', 'Beta', '%', '8.4 - 13.1', dates, ['10.6', '10.5', '10.0', '10.1']);
    addDataToSection('Immune Proteins', 'Gamma', '%', '11.1 - 18.8', dates, ['13.2', '13.3', '13.5', '13.3']);
    addDataToSection('Immune Proteins', 'IgG', 'mg/dl', '700 - 1600', dates, ['919', '925', '881', '803']);
    addDataToSection('Immune Proteins', 'IgA', 'mg/dl', '70 - 400', dates, ['155', '143', '163', '146']);
    addDataToSection('Immune Proteins', 'IgM', 'mg/dl', '40 - 230', dates, ['145', '153', '141', '135']);
    addDataToSection('Immune Proteins', 'IgE', 'IU/ml', '< 100', dates, ['437 +', '< 100', '< 100', '< 100']);
    
    // COVID-19 Tests
    addDataToSection('COVID-19 Tests', 'SARS-CoV-2 Spike Protein', '', '', dates, ['positiv', 'positiv', 'positiv', 'negativ']);
    addDataToSection('COVID-19 Tests', 'Antikörper', 'BAU/ml', '', dates, ['(>2080.0)', '(>2080.0)', '(1220.0)', '(<3.8)']);
    addDataToSection('COVID-19 Tests', 'Nucleocapsid Antikörper', '', '', dates, ['positiv', 'positiv', 'positiv', 'grenzwertig 12.0 -']);
    addDataToSection('COVID-19 Tests', 'COI', '', '', dates, ['(172.0)', '(8.6)', '', '']);
    
    // Additional Values (09.11.2023 only)
    const latestDate = ['09.11.2023'];
    addDataToSection('Additional Values', 'Vitamin D3', 'ng/ml', '20-50', latestDate, ['29.2']);
    addDataToSection('Additional Values', 'Vitamin B12', 'pg/ml', '197.0-1200', latestDate, ['254.0']);
    addDataToSection('Additional Values', 'PSA', 'ng/l', '<4', latestDate, ['0.368']);
    addDataToSection('Additional Values', 'Testosteron', 'mg/l', '2.49-8.36', latestDate, ['6.55']);
    addDataToSection('Additional Values', 'Freies Testosteron', 'mg/l', '0.057-0.178', latestDate, ['0.058']);
    addDataToSection('Additional Values', 'SHBG', 'mg/l', '20.60-76.70', latestDate, ['107.00+']);
    
    // Urinalysis (09.11.2023)
    addDataToSection('Urinalysis', 'pH', '', '', latestDate, ['7.5']);
    addDataToSection('Urinalysis', 'Spezifisches Gewicht', '', '1.002-1.040', latestDate, ['1.010']);
    addDataToSection('Urinalysis', 'Nitrit', '', 'negativ', latestDate, ['negativ']);
    addDataToSection('Urinalysis', 'Eiweiß', '', 'negativ', latestDate, ['negativ']);
    addDataToSection('Urinalysis', 'Glukose', '', 'negativ', latestDate, ['negativ']);
    addDataToSection('Urinalysis', 'Keton', '', 'negativ', latestDate, ['negativ']);
    addDataToSection('Urinalysis', 'Bilirubin', '', 'negativ', latestDate, ['negativ']);
    addDataToSection('Urinalysis', 'Urobilinogen', '', 'negativ', latestDate, ['negativ']);
    addDataToSection('Urinalysis', 'Leukozyten', '', 'negativ', latestDate, ['negativ']);
    addDataToSection('Urinalysis', 'Blut', '', 'negativ', latestDate, ['negativ']);
    
    function addDataToSection(
      section: string, 
      parameter: string, 
      unit: string, 
      referenceRange: string, 
      dates: string[], 
      values: string[]
    ) {
      dates.forEach((date, index) => {
        if (values[index] && values[index] !== '-') {
          sections[section].push({
            parameter,
            unit,
            referenceRange,
            date,
            value: values[index]
          });
        }
      });
    }
    
    return sections;
  };

  if (!isConnected) {
    return null;
  }

  return (
    <div className="legal-section">
      <h2>Medical Lab Data</h2>
      <div className="legal-content">
        {!isOptimismNetwork ? (
          <div className="alert alert-warning">
            <p>Please switch to Optimism network to use private data storage.</p>
            <button 
              className="button-primary" 
              onClick={handleSwitchToOptimism}
              disabled={loading}
            >
              Switch to Optimism
            </button>
          </div>
        ) : (
          <>
            {error && <div className="alert alert-error">{error}</div>}
            
            {!tableName ? (
              <div>
                <p>You don't have a medical data table yet. Create one to store your lab results securely.</p>
                <button 
                  className="button-primary" 
                  onClick={handleCreateTable}
                  disabled={loading}
                >
                  {loading ? 'Creating...' : 'Create Medical Table'}
                </button>
              </div>
            ) : (
              <div>
                <p>Your lab results are stored privately on Tableland on the Optimism network.</p>
                
                {!importedData ? (
                  <div>
                    <p>Import your medical data to view it in a structured format.</p>
                    <button 
                      className="button-primary" 
                      onClick={handleImportMedicalData}
                      disabled={loading}
                    >
                      {loading ? 'Importing...' : 'Import Medical Data'}
                    </button>
                  </div>
                ) : (
                  <div className="medical-data-container">
                    <h3>Your Medical History</h3>
                    
                    {/* Display sections in the same order as in the CSV file */}
                    {[
                      'Basic Blood Tests',
                      'Kidney Function',
                      'Electrolytes',
                      'Lipid Profile',
                      'Inflammation Markers',
                      'Thyroid Function',
                      'Blood Cell Count',
                      'Immune Proteins',
                      'COVID-19 Tests',
                      'Additional Values',
                      'Urinalysis'
                    ].map(section => (
                      <MedicalDataTable 
                        key={section} 
                        sectionTitle={section} 
                        data={medicalDataSections[section]} 
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
