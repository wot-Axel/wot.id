'use client';

import { useState, useEffect } from 'react';
import { useCeramic } from '@/contexts/CeramicContext';
import CeramicStatusPanel from '@/components/CeramicStatusPanel';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
// Use a simple button component instead of the missing UI component
interface ButtonProps {
  children: React.ReactNode;
  onClick?: (...args: any[]) => void;
  className?: string;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ children, onClick, className = '', disabled = false }) => (
  <button 
    onClick={onClick} 
    disabled={disabled}
    className={`px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
  >
    {children}
  </button>
);

// Use a simple alert component instead of the missing UI component
interface AlertProps {
  children: React.ReactNode;
  className?: string;
}

const Alert: React.FC<AlertProps> = ({ children, className = '' }) => (
  <div className={`p-4 border border-yellow-400 bg-yellow-50 rounded ${className}`}>
    {children}
  </div>
);

interface AlertTitleProps {
  children: React.ReactNode;
}

const AlertTitle: React.FC<AlertTitleProps> = ({ children }) => (
  <h4 className="font-medium mb-1">{children}</h4>
);

interface AlertDescriptionProps {
  children: React.ReactNode;
}

const AlertDescription: React.FC<AlertDescriptionProps> = ({ children }) => (
  <div>{children}</div>
);
import { DataType } from '@/composedb/ceramic';

export default function CeramicTestPage() {
  const { 
    client, 
    isConnected, 
    isConnecting, 
    error, 
    connect, 
    disconnect,
    getStatus
  } = useCeramic();
  
  const [testStreamId, setTestStreamId] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [isTestingWrite, setIsTestingWrite] = useState(false);
  
  // Get ceramic context once at the component level
  const ceramicContext = useCeramic();
  
  // Test writing to Ceramic
  const testWriteToCeramic = async () => {
    if (!client || !isConnected) {
      setTestError('Cannot test write: Ceramic is not connected');
      return;
    }
    
    setIsTestingWrite(true);
    setTestError(null);
    
    try {
      // Create a simple test document using our client interface
      const testDID = client.did?.id || 'did:key:test';
      const collectionInfo = await ceramicContext.ensureCollection(DataType.PROFILE, testDID);
      
      const testDoc = await ceramicContext.addRecord(
        DataType.PROFILE,
        testDID,
        { 
          test: 'connection', 
          timestamp: new Date().toISOString(),
          message: 'This is a test document from wot.id'
        },
        ['test', 'connection']
      );
      
      setTestStreamId(testDoc.id);
      console.log('Successfully created test document with ID:', testDoc.id.toString());
    } catch (error) {
      console.error('Error writing to Ceramic:', error);
      setTestError(error instanceof Error ? error.message : String(error));
    } finally {
      setIsTestingWrite(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold">Ceramic Network Test Page</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Ceramic Connection Status</CardTitle>
            <CardDescription>
              Current status of your connection to the Ceramic network
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CeramicStatusPanel />
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>Test Ceramic Write</CardTitle>
            <CardDescription>
              Test writing a document to the Ceramic network
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isConnected ? (
              <>
                <div className="text-sm">
                  <p><strong>Connected to:</strong> {getStatus().lastSuccessfulNode || 'Unknown'}</p>
                  <p><strong>DID:</strong> {client?.did?.id || 'Unknown'}</p>
                </div>
                
                <Button 
                  onClick={testWriteToCeramic} 
                  disabled={isTestingWrite || !isConnected}
                >
                  {isTestingWrite ? 'Testing...' : 'Test Write to Ceramic'}
                </Button>
                
                {testStreamId && (
                  <Alert className="bg-green-50 border-green-200">
                    <AlertTitle>Success!</AlertTitle>
                    <AlertDescription>
                      Successfully created document with Stream ID: <code className="bg-green-100 p-1 rounded">{testStreamId}</code>
                    </AlertDescription>
                  </Alert>
                )}
                
                {testError && (
                  <Alert className="bg-red-50 border-red-200">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{testError}</AlertDescription>
                  </Alert>
                )}
              </>
            ) : (
              <div className="text-center py-4">
                <p className="mb-4">You need to connect to Ceramic first</p>
                <Button onClick={connect} disabled={isConnecting}>
                  {isConnecting ? 'Connecting...' : 'Connect to Ceramic'}
                </Button>
                
                {error && (
                  <Alert className="mt-4 bg-red-50 border-red-200">
                    <AlertTitle>Connection Error</AlertTitle>
                    <AlertDescription>{error.message}</AlertDescription>
                  </Alert>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>About Ceramic Network</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mb-4">
            Ceramic is a decentralized data network that powers Web3 applications with composable data. 
            It enables developers to build applications with composable Web3 data that can be reused, 
            composed, and extended.
          </p>
          <p>
            This test page allows you to verify your connection to the Ceramic network and test basic
            read/write operations.
          </p>
        </CardContent>
        <CardFooter>
          <a 
            href="https://ceramic.network/" 
            target="_blank" 
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Learn more about Ceramic Network
          </a>
        </CardFooter>
      </Card>
    </div>
  );
}
