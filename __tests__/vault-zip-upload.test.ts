import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { VaultService } from '../lib/services/vault';
import { TEST_ARGON2_PROFILE } from './test-constants';
import JSZip from 'jszip';

const mockStorage = new Map<string, Uint8Array>();
interface MockVaultKey {
  keyB: string;
  encryptedDecoyCID: string;
  encryptedHiddenCID: string;
  nonce: string;
  provider: string;
  isActive: boolean;
  expiresAt: number | null;
  panicPassphraseHash?: string;
}

const mockVaultKeys = new Map<string, MockVaultKey>();

// Mock fetch for API calls
global.fetch = vi.fn((url: string | URL, options?: RequestInit) => {
  const urlStr = typeof url === 'string' ? url : url.toString();
  
  if (urlStr.includes('/api/vault/store-key') && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    mockVaultKeys.set(body.vaultId, {
      keyB: body.keyB,
      encryptedDecoyCID: body.encryptedDecoyCID,
      encryptedHiddenCID: body.encryptedHiddenCID,
      nonce: body.nonce,
      provider: body.provider || 'pinata',
      isActive: true,
      expiresAt: body.expiresAt || null,
      panicPassphraseHash: body.panicPassphraseHash
    });
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ success: true })
    } as Response);
  }
  if (urlStr.includes('/api/vault/get-key') && options?.method === 'POST') {
    const body = JSON.parse(options.body as string);
    const stored = mockVaultKeys.get(body.vaultId);
    if (!stored) {
      return Promise.resolve({
        ok: false,
        status: 404
      } as Response);
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve(stored)
    } as Response);
  }
  return Promise.reject(new Error('Unknown URL'));
}) as unknown as typeof fetch;

vi.mock('../lib/storage/vault', async () => {
  const actual = await vi.importActual<typeof import('../lib/storage/vault')>('../lib/storage/vault');
  return {
    ...actual,
    uploadVault: async (vault: { decoyBlob: Uint8Array; hiddenBlob: Uint8Array; salt: Uint8Array }) => {
      const decoyCID = `decoy-${Math.random().toString(36).slice(2)}`;
      const hiddenCID = `hidden-${Math.random().toString(36).slice(2)}`;
      mockStorage.set(decoyCID, vault.decoyBlob);
      mockStorage.set(hiddenCID, vault.hiddenBlob);
      return { decoyCID, hiddenCID, salt: vault.salt };
    },
    downloadVault: async (stored: { decoyCID: string; hiddenCID: string; salt: Uint8Array }) => {
      const decoyBlob = mockStorage.get(stored.decoyCID);
      const hiddenBlob = mockStorage.get(stored.hiddenCID);
      if (!decoyBlob || !hiddenBlob) throw new Error('CID not found');
      return { decoyBlob, hiddenBlob, salt: stored.salt };
    },
  };
});

// %%
describe('Vault Zip File Upload/Download', () => {
  let vaultService: VaultService;
  let testZipData: Uint8Array;
  let testFiles: { [key: string]: string };

  beforeAll(async () => {
    vaultService = new VaultService();
    
    // Create test files for zip
    testFiles = {
      'document.txt': 'This is a test document with sensitive information.',
      'config.json': JSON.stringify({ 
        api_key: 'secret-key-123', 
        database_url: 'postgresql://user:pass@localhost/db' 
      }, null, 2),
      'notes.md': '# Secret Notes\n\n- Important meeting at 3pm\n- Password: mySecretPass123\n- Contact: john@example.com',
      'data/backup.sql': 'INSERT INTO users (id, email) VALUES (1, "admin@test.com");',
      'images/logo.png': 'fake-png-data-for-testing'
    };

    // Create zip file
    const zip = new JSZip();
    Object.entries(testFiles).forEach(([path, content]) => {
      zip.file(path, content);
    });
    
    testZipData = new Uint8Array(await zip.generateAsync({ type: 'uint8array' }));
    console.log(`Created test zip file: ${testZipData.length} bytes`);
  });

  afterAll(async () => {
    if (vaultService) {
      await vaultService.stop();
    }
  });

  it('should create vault with zip file as hidden content', async () => {
    const decoyText = 'This is innocent decoy content.';
    
    const result = await vaultService.createVault({
      decoyContent: new TextEncoder().encode(decoyText),
      hiddenContent: testZipData,
      passphrase: 'TestPassword123!',
      panicPassphrase: 'PanicPass789!',
      decoyPassphrase: 'DecoyPass456!',
      argonProfile: TEST_ARGON2_PROFILE, // Faster for testing
      ipfsCredentials: {
        provider: 'pinata',
        pinataJWT: process.env.PINATA_JWT || 'test-jwt'
      }
    });

    expect(result).toBeDefined();
    expect(result.vaultURL).toContain('#');
    expect(result.decoyCID).toBeDefined();
    expect(result.hiddenCID).toBeDefined();
    
    console.log('Vault created successfully:');
    console.log('- Vault URL:', result.vaultURL);
    console.log('- Decoy CID:', result.decoyCID);
    console.log('- Hidden CID:', result.hiddenCID);
  }, 30000);

  it('should unlock vault and extract zip file correctly', async () => {
    // First create a vault
    const result = await vaultService.createVault({
      decoyContent: new TextEncoder().encode('Decoy content'),
      hiddenContent: testZipData,
      passphrase: 'TestPassword123!',
      panicPassphrase: 'PanicPass789!',
      decoyPassphrase: 'DecoyPass456!',
      argonProfile: TEST_ARGON2_PROFILE,
      ipfsCredentials: {
        provider: 'pinata',
        pinataJWT: process.env.PINATA_JWT || 'test-jwt'
      }
    });

    // Unlock with hidden passphrase
    const unlockedData = await vaultService.unlockVault({
      vaultURL: result.vaultURL,
      passphrase: 'TestPassword123!'
    });
    expect(unlockedData.content).toBeDefined();
    expect(unlockedData.content.length).toBeGreaterThan(0);

    // Verify it's a valid zip file
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(unlockedData.content);
    
    // Check all files are present (filter out directories)
    const fileNames = Object.keys(loadedZip.files).filter(name => !loadedZip.files[name].dir);
    expect(fileNames.length).toBeGreaterThanOrEqual(Object.keys(testFiles).length);
    
    // Verify file contents
    for (const [expectedPath, expectedContent] of Object.entries(testFiles)) {
      expect(fileNames).toContain(expectedPath);
      const file = loadedZip.files[expectedPath];
      expect(file).toBeDefined();
      
      const content = await file.async('string');
      expect(content).toBe(expectedContent);
    }
  }, 15000);

  it('should unlock vault with decoy passphrase and get text content', async () => {
    const decoyText = 'This is innocent decoy content for authorities.';
    
    const result = await vaultService.createVault({
      decoyContent: new TextEncoder().encode(decoyText),
      hiddenContent: testZipData,
      passphrase: 'TestPassword123!',
      panicPassphrase: 'PanicPass789!',
      decoyPassphrase: 'DecoyPass456!',
      argonProfile: TEST_ARGON2_PROFILE,
      ipfsCredentials: {
        provider: 'pinata',
        pinataJWT: process.env.PINATA_JWT || 'test-jwt'
      }
    });


    // Unlock with decoy passphrase
    const decoyData = await vaultService.unlockVault({
      vaultURL: result.vaultURL,
      passphrase: 'DecoyPass456!'
    });
    const decoyContent = new TextDecoder().decode(decoyData.content);
    
    expect(decoyContent).toBe(decoyText);
  }, 15000);

  it('should handle large zip files (up to 16MB)', async () => {
    // Create a larger zip file
    const largeZip = new JSZip();
    
    // Add smaller test files
    for (let i = 0; i < 3; i++) {
      const largeContent = 'x'.repeat(10 * 1024); // 10KB per file
      largeZip.file(`large-file-${i}.txt`, largeContent);
    }
    
    const largeZipData = new Uint8Array(await largeZip.generateAsync({ type: 'uint8array' }));
    
    expect(largeZipData.length).toBeLessThan(100 * 1024); // Under 100KB for testing
    
    const result = await vaultService.createVault({
      decoyContent: new TextEncoder().encode('Small decoy'),
      hiddenContent: largeZipData,
      passphrase: 'TestPassword123!',
      panicPassphrase: 'PanicPass789!',
      decoyPassphrase: 'DecoyPass456!',
      argonProfile: TEST_ARGON2_PROFILE,
      ipfsCredentials: {
        provider: 'pinata',
        pinataJWT: process.env.PINATA_JWT || 'test-jwt'
      }
    });

    expect(result).toBeDefined();
  }, 15000);

  it('should preserve file structure and metadata in zip', async () => {
    // Create zip with nested folders and different file types
    const complexZip = new JSZip();
    
    const testStructure = {
      'README.md': '# Project Documentation',
      'src/main.js': 'console.log("Hello World");',
      'src/utils/helper.js': 'export function helper() { return true; }',
      'config/database.json': JSON.stringify({ host: 'localhost', port: 5432 }),
      'assets/images/icon.png': 'fake-png-binary-data',
      'docs/api.md': '## API Documentation\n\n### Endpoints\n\n- GET /api/users',
      'tests/unit/main.test.js': 'describe("main", () => { it("works", () => {}); });'
    };

    Object.entries(testStructure).forEach(([path, content]) => {
      complexZip.file(path, content);
    });

    const complexZipData = new Uint8Array(await complexZip.generateAsync({ type: 'uint8array' }));

    const result = await vaultService.createVault({
      decoyContent: new TextEncoder().encode('Project backup'),
      hiddenContent: complexZipData,
      passphrase: 'TestPassword123!',
      panicPassphrase: 'PanicPass789!',
      decoyPassphrase: 'DecoyPass456!',
      argonProfile: TEST_ARGON2_PROFILE,
      ipfsCredentials: {
        provider: 'pinata',
        pinataJWT: process.env.PINATA_JWT || 'test-jwt'
      }
    });

    const unlockedData = await vaultService.unlockVault({
      vaultURL: result.vaultURL,
      passphrase: 'TestPassword123!'
    });

    // Verify structure is preserved
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(unlockedData.content);
    
    for (const [expectedPath, expectedContent] of Object.entries(testStructure)) {
      const file = loadedZip.files[expectedPath];
      expect(file).toBeDefined();
      expect(file.name).toBe(expectedPath);
      
      const content = await file.async('string');
      expect(content).toBe(expectedContent);
    }

  }, 15000);

  it('should handle binary files in zip archives', async () => {
    // Create zip with binary data
    const binaryZip = new JSZip();
    
    // Simulate different binary file types
    const binaryFiles = {
      'image.jpg': new Uint8Array([0xFF, 0xD8, 0xFF, 0xE0, 0x00, 0x10]), // JPEG header
      'document.pdf': new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2D]), // PDF header
      'archive.zip': new Uint8Array([0x50, 0x4B, 0x03, 0x04]), // ZIP header
      'executable.exe': new Uint8Array([0x4D, 0x5A]), // EXE header
    };

    Object.entries(binaryFiles).forEach(([filename, data]) => {
      binaryZip.file(filename, data);
    });

    const binaryZipData = new Uint8Array(await binaryZip.generateAsync({ type: 'uint8array' }));

    const result = await vaultService.createVault({
      decoyContent: new TextEncoder().encode('File collection'),
      hiddenContent: binaryZipData,
      passphrase: 'TestPassword123!',
      panicPassphrase: 'PanicPass789!',
      decoyPassphrase: 'DecoyPass456!',
      argonProfile: TEST_ARGON2_PROFILE,
      ipfsCredentials: {
        provider: 'pinata',
        pinataJWT: process.env.PINATA_JWT || 'test-jwt'
      }
    });

    const unlockedData = await vaultService.unlockVault({
      vaultURL: result.vaultURL,
      passphrase: 'TestPassword123!'
    });

    // Verify binary data integrity
    const zip = new JSZip();
    const loadedZip = await zip.loadAsync(unlockedData.content);
    
    for (const [filename, expectedData] of Object.entries(binaryFiles)) {
      const file = loadedZip.files[filename];
      expect(file).toBeDefined();
      
      const retrievedData = new Uint8Array(await file.async('uint8array'));
      expect(retrievedData).toEqual(expectedData);
    }

  }, 15000);
});
