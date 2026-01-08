/**
 * WebSocket service for decrypting medical records using local certificate store
 * Connects to local desktop app running on wss://localhost:2025
 */

const WSS_URL = 'wss://localhost:2025';

class WSDecryptionService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.messageQueue = [];
    this.pendingRequests = new Map(); // Track pending requests by ID
    this.requestIdCounter = 0;
    this.publicKeyCallback = null; // Callback for public key registration
  }

  /**
   * Connect to WebSocket server
   * @returns {Promise<void>}
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.isConnected && this.ws?.readyState === WebSocket.OPEN) {
        resolve();
        return;
      }

      try {
        this.ws = new WebSocket(WSS_URL);

        this.ws.onopen = () => {
          console.log('WSS Decryption Service connected');
          this.isConnected = true;
          this.processPendingMessages();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message = event.data;

            // Handle CERT: messages (public key registration)
            if (typeof message === 'string' && message.startsWith('CERT:')) {
              const publicKey = message.substring(5); // Remove "CERT:" prefix
              console.log('Received public key from certificate');
              this.handlePublicKeyReceived(publicKey);
              return;
            }

            // Handle JSON responses (for decrypt operations)
            const response = JSON.parse(message);
            console.log('WSS Response received:', response);

            // Handle response with requestId (standard format)
            const requestId = response.requestId;
            if (requestId && this.pendingRequests.has(requestId)) {
              const { resolve: resolveRequest } = this.pendingRequests.get(requestId);
              this.pendingRequests.delete(requestId);
              resolveRequest(response);
              return;
            }

            // Handle response without requestId (check if it has results)
            // If we have any pending requests, resolve the first one
            if (response.results && this.pendingRequests.size > 0) {
              const firstRequest = this.pendingRequests.entries().next().value;
              if (firstRequest) {
                const [reqId, { resolve: resolveRequest }] = firstRequest;
                this.pendingRequests.delete(reqId);
                // Transform response to expected format
                resolveRequest({
                  requestId: reqId,
                  records: response.results
                });
              }
            }
          } catch (error) {
            console.error('Failed to parse WSS response:', error);
          }
        };

        this.ws.onerror = (error) => {
          console.error('WSS connection error:', error);
          this.isConnected = false;
          reject(new Error('Failed to connect to decryption service'));
        };

        this.ws.onclose = () => {
          console.log('WSS connection closed');
          this.isConnected = false;
          // Reject all pending requests
          this.pendingRequests.forEach(({ reject: rejectRequest }) => {
            rejectRequest(new Error('WebSocket connection closed'));
          });
          this.pendingRequests.clear();
        };
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Disconnect from WebSocket server
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
    }
  }

  /**
   * Process queued messages after connection established
   */
  processPendingMessages() {
    while (this.messageQueue.length > 0) {
      const message = this.messageQueue.shift();
      this.ws.send(message);
    }
  }

  /**
   * Decrypt medical records using local certificate store
   * @param {Array} encryptedRecords - Array of encrypted records with format:
   *   [{ id, encryptedAESKey, encryptedDescription }, ...]
   * @returns {Promise<Array>} Array of decrypted medical data (JSON objects)
   */
  async decryptRecords(encryptedRecords) {
    // Ensure connection
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      const requestId = ++this.requestIdCounter;

      // Prepare message
      const message = JSON.stringify({
        requestId,
        action: 'decrypt',
        records: encryptedRecords.map(record => ({
          id: record.id,
          encryptedAESKey: record.encryptedAESKey,
          encryptedDescription: record.encryptedDescription
        }))
      });

      // Store pending request
      this.pendingRequests.set(requestId, { resolve, reject });

      // Send message
      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('Sending decryption request to WSS:', { requestId, recordCount: encryptedRecords.length });
        this.ws.send(message);
      } else {
        // Queue if not connected
        this.messageQueue.push(message);
        this.connect().catch(reject);
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.pendingRequests.has(requestId)) {
          this.pendingRequests.delete(requestId);
          reject(new Error('Decryption request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Handle public key received from WSS (CERT: message)
   * @param {string} publicKey - Base64 encoded public key
   */
  handlePublicKeyReceived(publicKey) {
    if (this.publicKeyCallback) {
      this.publicKeyCallback(publicKey);
      this.publicKeyCallback = null;
    }
  }

  /**
   * Request public key from certificate
   * Sends "GETPUBLICKEY" message and waits for "CERT:..." response
   * @returns {Promise<string>} Base64 encoded public key
   */
  async requestPublicKey() {
    // Ensure connection
    if (!this.isConnected) {
      await this.connect();
    }

    return new Promise((resolve, reject) => {
      // Set callback for when CERT: message is received
      this.publicKeyCallback = resolve;

      // Send simple message
      const message = 'GETPUBLICKEY';

      if (this.ws?.readyState === WebSocket.OPEN) {
        console.log('Requesting public key from WSS');
        this.ws.send(message);
      } else {
        // Queue if not connected
        this.messageQueue.push(message);
        this.connect().catch(reject);
      }

      // Timeout after 30 seconds
      setTimeout(() => {
        if (this.publicKeyCallback === resolve) {
          this.publicKeyCallback = null;
          reject(new Error('Public key request timeout'));
        }
      }, 30000);
    });
  }

  /**
   * Check if service is connected
   * @returns {boolean}
   */
  isServiceConnected() {
    return this.isConnected && this.ws?.readyState === WebSocket.OPEN;
  }
}

// Export singleton instance
export const wsDecryptionService = new WSDecryptionService();

// Auto-connect on module load
wsDecryptionService.connect().catch(err => {
  console.warn('WSS Decryption Service not available:', err.message);
});

export default wsDecryptionService;
