import React, { useState, useEffect, useCallback } from 'react';
import { useAppKit } from '../context';
import {
  Box,
  Button,
  Heading,
  Text,
  VStack,
  HStack,
  useToast,
  Select,
  Input,
  FormControl,
  FormLabel,
  Divider,
  Spinner,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { CeramicClient } from '@ceramicnetwork/http-client';
import { 
  DataType, 
  ContentRecord, 
  initCeramic, 
  checkCollectionExists, 
  createCollection, 
  createRecord, 
  getRecords,
  updateRecord,
  deleteRecord,
  clearCollection
} from '../utils/ceramicUtils';

// Define medical parameter categories
const MEDICAL_CATEGORIES = {
  'Basic Blood Tests': [
    'Glucose',
    'Hemoglobin A1c',
  ],
  'Kidney Function': [
    'Creatinine',
    'eGFR',
    'BUN',
  ],
  'Electrolytes': [
    'Sodium',
    'Potassium',
    'Chloride',
    'CO2',
  ],
  'Lipid Profile': [
    'Total Cholesterol',
    'HDL',
    'LDL',
    'Triglycerides',
  ],
  'Inflammation Markers': [
    'CRP',
    'ESR',
  ],
  'Thyroid Function': [
    'TSH',
    'Free T4',
    'Free T3',
  ],
  'Blood Cell Count': [
    'WBC',
    'RBC',
    'Platelets',
    'Hemoglobin',
    'Hematocrit',
  ],
  'Immune Proteins': [
    'IgG',
    'IgA',
    'IgM',
  ],
  'COVID-19 Tests': [
    'SARS-CoV-2 PCR',
    'SARS-CoV-2 Antibody',
  ],
  'Additional Values': [
    'Vitamin D',
    'Vitamin B12',
    'Ferritin',
    'Iron',
  ],
  'Urinalysis': [
    'pH',
    'Specific Gravity',
    'Protein',
    'Glucose',
    'Ketones',
    'Blood',
    'Leukocytes',
  ],
};

// Flatten the categories into a single array of parameters
const ALL_PARAMETERS = Object.values(MEDICAL_CATEGORIES).flat();

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

const CeramicMedicalDataSection: React.FC = () => {
  const { address, provider } = useAppKit();
  const toast = useToast();
  
  // State variables
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
  
  // Initialize Ceramic when the component mounts
  useEffect(() => {
    if (address && provider) {
      initializeCeramic();
    }
  }, [address, provider]);
  
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
    if (!address || !provider) {
      toast({
        title: 'Error',
        description: 'Please connect your wallet first',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    setIsInitializing(true);
    
    try {
      // Initialize Ceramic client
      const { ceramic: ceramicClient } = await initCeramic(provider, address);
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
      
      toast({
        title: 'Connected to Ceramic',
        description: 'Successfully connected to the Ceramic network',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error initializing Ceramic:', error);
      toast({
        title: 'Error',
        description: 'Failed to initialize Ceramic',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      
      toast({
        title: 'Data Loaded',
        description: `Loaded ${medicalDataArray.length} medical records`,
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error loading medical data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load medical data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Add new medical data
  const handleAddMedicalData = async () => {
    if (!ceramic || !collectionId) {
      toast({
        title: 'Error',
        description: 'Ceramic not initialized',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    if (!parameter || !value || !unit || !date) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      
      toast({
        title: 'Success',
        description: 'Medical data added successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error adding medical data:', error);
      toast({
        title: 'Error',
        description: 'Failed to add medical data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Refresh medical data
  const handleRefreshData = useCallback(async () => {
    if (!ceramic || !collectionId) {
      toast({
        title: 'Error',
        description: 'Ceramic not initialized',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }
    
    await loadMedicalData(ceramic, collectionId);
  }, [ceramic, collectionId, toast]);
  
  // Clear all medical data
  const handleClearAllData = async () => {
    if (!ceramic || !collectionId) {
      toast({
        title: 'Error',
        description: 'Ceramic not initialized',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
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
      
      toast({
        title: 'Success',
        description: 'All medical data cleared successfully',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (error) {
      console.error('Error clearing medical data:', error);
      toast({
        title: 'Error',
        description: 'Failed to clear medical data',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Render the component
  return (
    <Box p={4}>
      <Heading as="h2" size="lg" mb={4}>
        Medical Data
      </Heading>
      
      {!address ? (
        <Alert status="warning" mb={4}>
          <AlertIcon />
          <AlertTitle>Not connected!</AlertTitle>
          <AlertDescription>Please connect your wallet to manage your medical data.</AlertDescription>
        </Alert>
      ) : isInitializing ? (
        <Box textAlign="center" py={10}>
          <Spinner size="xl" />
          <Text mt={4}>Initializing Ceramic...</Text>
        </Box>
      ) : (
        <>
          {/* Add new medical data form */}
          <Box mb={8} p={4} borderWidth={1} borderRadius="md">
            <Heading as="h3" size="md" mb={4}>
              Add New Medical Data
            </Heading>
            
            <VStack spacing={4} align="stretch">
              <FormControl isRequired>
                <FormLabel>Parameter</FormLabel>
                <Select 
                  placeholder="Select parameter" 
                  value={parameter} 
                  onChange={(e) => setParameter(e.target.value)}
                >
                  {Object.entries(MEDICAL_CATEGORIES).map(([category, parameters]) => (
                    <optgroup label={category} key={category}>
                      {parameters.map(param => (
                        <option value={param} key={param}>{param}</option>
                      ))}
                    </optgroup>
                  ))}
                </Select>
              </FormControl>
              
              <HStack>
                <FormControl isRequired>
                  <FormLabel>Value</FormLabel>
                  <Input 
                    value={value} 
                    onChange={(e) => setValue(e.target.value)} 
                    placeholder="e.g. 120"
                  />
                </FormControl>
                
                <FormControl isRequired>
                  <FormLabel>Unit</FormLabel>
                  <Input 
                    value={unit} 
                    onChange={(e) => setUnit(e.target.value)} 
                    placeholder="e.g. mg/dL"
                  />
                </FormControl>
              </HStack>
              
              <FormControl isRequired>
                <FormLabel>Date</FormLabel>
                <Input 
                  type="date" 
                  value={date} 
                  onChange={(e) => setDate(e.target.value)}
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Reference Range</FormLabel>
                <Input 
                  value={referenceRange} 
                  onChange={(e) => setReferenceRange(e.target.value)} 
                  placeholder="e.g. 70-99 mg/dL"
                />
              </FormControl>
              
              <FormControl>
                <FormLabel>Notes</FormLabel>
                <Input 
                  value={notes} 
                  onChange={(e) => setNotes(e.target.value)} 
                  placeholder="Any additional notes"
                />
              </FormControl>
              
              <Button 
                colorScheme="blue" 
                onClick={handleAddMedicalData} 
                isLoading={isLoading}
                loadingText="Adding..."
              >
                Add Medical Data
              </Button>
            </VStack>
          </Box>
          
          {/* Display medical data */}
          <Box mb={4}>
            <HStack justifyContent="space-between" mb={4}>
              <Heading as="h3" size="md">
                Your Medical Data
              </Heading>
              <HStack>
                <Button 
                  colorScheme="blue" 
                  variant="outline" 
                  onClick={handleRefreshData} 
                  isLoading={isLoading}
                  loadingText="Refreshing..."
                >
                  Refresh Data
                </Button>
                <Button 
                  colorScheme="red" 
                  variant="outline" 
                  onClick={handleClearAllData}
                  isDisabled={isLoading || Object.keys(groupedData).length === 0}
                >
                  Clear All Data
                </Button>
              </HStack>
            </HStack>
            
            {isLoading ? (
              <Box textAlign="center" py={10}>
                <Spinner size="xl" />
                <Text mt={4}>Loading medical data...</Text>
              </Box>
            ) : Object.keys(groupedData).length === 0 ? (
              <Alert status="info">
                <AlertIcon />
                <AlertTitle>No data yet!</AlertTitle>
                <AlertDescription>Add your first medical data point above.</AlertDescription>
              </Alert>
            ) : (
              <VStack spacing={6} align="stretch">
                {Object.entries(groupedData).map(([parameter, dataPoints]) => (
                  <Box key={parameter} p={4} borderWidth={1} borderRadius="md">
                    <Heading as="h4" size="sm" mb={2}>
                      {parameter}
                    </Heading>
                    
                    <VStack spacing={2} align="stretch">
                      {dataPoints.map((data, index) => (
                        <Box key={index} p={2} bg="gray.50" borderRadius="md">
                          <HStack justify="space-between">
                            <Text fontWeight="bold">
                              {data.value} {data.unit}
                            </Text>
                            <Text fontSize="sm" color="gray.500">
                              {new Date(data.date).toLocaleDateString()}
                            </Text>
                          </HStack>
                          
                          {data.referenceRange && (
                            <Text fontSize="sm">
                              Reference Range: {data.referenceRange}
                            </Text>
                          )}
                          
                          {data.notes && (
                            <Text fontSize="sm" fontStyle="italic">
                              Notes: {data.notes}
                            </Text>
                          )}
                        </Box>
                      ))}
                    </VStack>
                  </Box>
                ))}
              </VStack>
            )}
          </Box>
        </>
      )}
    </Box>
  );
};

export default CeramicMedicalDataSection;
