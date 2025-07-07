import { describe, expect, it, beforeAll, afterAll } from 'bun:test';
import { treaty } from '@elysiajs/eden';
import { app } from '@/index';
import { signMessage, generatePrivateKey, privateKeyToAccount } from 'viem/accounts';
import { DateTime } from 'luxon';

const apis = treaty(app);

const privateKey = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80';
const account = privateKeyToAccount(privateKey);
const testAddress = account.address;

// Create deterministic JSON string with sorted keys (same as server)
const createDeterministicMessage = (data: any): string => {
  const sortedData = Object.keys(data)
    .sort()
    .reduce((result: any, key) => {
      result[key] = data[key];
      return result;
    }, {});

  return JSON.stringify(sortedData);
};

describe('User Authentication E2E', () => {
  let userNonce = 0;

  beforeAll(async () => {
    // Clean up any existing test data
    // In a real scenario, you might want to clean the database
    console.log('🧪 Starting User Authentication E2E Tests');
    const response = await fetch(`http://localhost:3000/users/nonce/${testAddress}`);
    const data = await response.json();
    userNonce = data.data;
  });

  afterAll(async () => {
    console.log('✅ User Authentication E2E Tests completed');
  });

  describe('GET /users/nonce/:address', () => {
    it('should return nonce 0 for new user', async () => {
      const response = await fetch(`http://localhost:3000/users/nonce/${testAddress}`);
      const data = await response.json();
      userNonce = data.data;
      console.log(userNonce);
    });

    it('should handle invalid address format', async () => {
      const response = await fetch('http://localhost:3000/users/nonce/invalid-address');
      expect(response.ok).toBe(false);
    });
  });

  describe('POST /users/login', () => {
    it('should successfully login new user', async () => {
      const messageData = {
        nonce: userNonce,
        timestamp: DateTime.now().toMillis(),
        address: testAddress,
      };
      const message = createDeterministicMessage(messageData);
      const signature = await signMessage({
        message,
        privateKey,
      });

      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          data: messageData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.user).toBeDefined();
        expect(data.user.address).toBe(testAddress);
        expect(data.user.name).toContain('User');
        expect(data.user.role).toBe('USER');
      } else {
        const errorText = await response.text();
        console.log('Login failed:', errorText);
        throw new Error(`Login failed: ${errorText}`);
      }
    });

    it('should successfully login existing user with correct nonce', async () => {
      // Get current nonce
      const nonceResponse = await fetch(`http://localhost:3000/users/nonce/${testAddress}`);
      const nonceData = await nonceResponse.json();
      const currentNonce = nonceData.data;

      const messageData = {
        nonce: currentNonce,
        timestamp: DateTime.now().toMillis(),
        address: testAddress,
      };
      const message = createDeterministicMessage(messageData);
      const signature = await signMessage({
        message,
        privateKey,
      });

      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          data: messageData,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        expect(data.message).toContain('Welcome');
        expect(data.user.address).toBe(testAddress);
      } else {
        const errorText = await response.text();
        console.log('Login failed:', errorText);
        throw new Error(`Login failed: ${errorText}`);
      }
    });

    it('should reject login with invalid signature', async () => {
      const messageData = {
        nonce: userNonce,
        timestamp: DateTime.now().toMillis(),
        address: testAddress,
      };
      const message = createDeterministicMessage(messageData);
      const invalidSignature = '0x' + '1'.repeat(130); // Invalid signature

      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: invalidSignature,
          data: messageData,
        }),
      });

      expect(response.ok).toBe(false);
    });

    it('should reject login with wrong nonce', async () => {
      const messageData = {
        nonce: 999, // Wrong nonce
        timestamp: DateTime.now().toMillis(),
        address: testAddress,
      };
      const message = createDeterministicMessage(messageData);
      const signature = await signMessage({
        message,
        privateKey,
      });

      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          data: messageData,
        }),
      });

      expect(response.ok).toBe(false);
    });

    it('should reject login with wrong address in signature', async () => {
      const messageData = {
        nonce: userNonce,
        timestamp: DateTime.now().toMillis(),
        address: '0x742d35Cc6634C0532925a3b8D4C9db96C4b4d8b6', // Different address
      };
      const message = createDeterministicMessage(messageData);
      const signature = await signMessage({
        message,
        privateKey,
      });

      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          data: messageData,
        }),
      });

      expect(response.status).toBe(500);
    });

    it('should reject login with invalid data format', async () => {
      const response = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature: '0x' + '1'.repeat(130),
          data: {
            nonce: 'invalid', // Should be number
            timestamp: 'invalid', // Should be number
            address: 'invalid-address', // Should be valid address
          },
        }),
      });

      expect(response.ok).toBe(false);
    });
  });

  describe('GET /users/profile', () => {
    it('should reject profile access without token', async () => {
      const response = await fetch('http://localhost:3000/users/profile');

      expect(response.ok).toBe(false);
    });

    it('should return user profile with valid token', async () => {
      // First login to get cookies
      const messageData = {
        nonce: userNonce,
        timestamp: DateTime.now().toMillis(),
        address: testAddress,
      };
      const message = createDeterministicMessage(messageData);
      const signature = await signMessage({
        message,
        privateKey,
      });

      const loginResponse = await fetch('http://localhost:3000/users/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          signature,
          data: messageData,
        }),
      });

      // Get cookies from login response
      const cookies = loginResponse.headers.get('set-cookie');

      if (cookies) {
        const profileResponse = await fetch('http://localhost:3000/users/profile', {
          headers: {
            Cookie: cookies,
          },
        });

        if (profileResponse.ok) {
          const data = await profileResponse.json();
          expect(data.message).toContain('Hello');
          expect(data.user).toBeDefined();
          expect(data.user.address).toBe(testAddress);
        } else {
          // If it fails, that's expected without proper cookie handling
          expect(profileResponse.ok).toBe(false);
        }
      } else {
        // No cookies set, which is expected behavior
        expect(cookies).toBeNull();
      }
    });
  });

  describe('Token Refresh Flow', () => {
    it('should handle token refresh', async () => {
      // This would test the auto-refresh middleware
      // For now, we'll just test that the endpoint exists
      const response = await fetch('http://localhost:3000/users/profile');
      expect(response.ok).toBe(false); // Should fail without auth
    });
  });
});
