import React from 'react';
import { Box, Container, Heading, Text, Button, VStack, HStack } from '@chakra-ui/react';
import { useAppKit } from '../context';
import CeramicMedicalDataSection from '../components/CeramicMedicalDataSection.new';
import Layout from '../components/Layout';

const CeramicTestPage: React.FC = () => {
  const { address, connect, disconnect } = useAppKit();

  return (
    <Layout>
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box textAlign="center">
            <Heading as="h1" size="xl" mb={4}>
              Ceramic Integration Test
            </Heading>
            <Text fontSize="lg" color="gray.600">
              This page demonstrates the new Ceramic integration for wot.id
            </Text>
          </Box>

          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <VStack spacing={4} align="stretch">
              <Heading as="h2" size="md">
                Wallet Connection
              </Heading>
              
              {address ? (
                <HStack justifyContent="space-between">
                  <Text>
                    Connected: <Text as="span" fontWeight="bold">{address}</Text>
                  </Text>
                  <Button colorScheme="red" variant="outline" onClick={disconnect}>
                    Disconnect
                  </Button>
                </HStack>
              ) : (
                <Button colorScheme="blue" onClick={connect}>
                  Connect Wallet
                </Button>
              )}
            </VStack>
          </Box>

          <Box p={6} borderWidth={1} borderRadius="lg" bg="white">
            <CeramicMedicalDataSection />
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default CeramicTestPage;
