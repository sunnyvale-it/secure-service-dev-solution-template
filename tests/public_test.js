const { spawn } = require('child_process');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');

const apiUrl = process.env.API_URL || 'https://secure-service-1-0.onrender.com'; // Default example API

console.log('--- Starting Public Test ---');
console.log(`Target API: ${apiUrl}`);
console.log(`(You can override this by setting the API_URL environment variable)\n`);

const workspacePath = path.resolve(__dirname, '..');
let outputBuffer = '';

const child = spawn('bash', ['run.sh'], {
  cwd: workspacePath,
  env: { ...process.env, API_URL: apiUrl },
  stdio: ['ignore', 'pipe', 'pipe']
});

child.stdout.on('data', (data) => {
  const str = data.toString();
  process.stdout.write(str);
  outputBuffer += str;
});

child.stderr.on('data', (data) => {
  const str = data.toString();
  process.stderr.write(str);
  outputBuffer += str;
});

// Timeout: 5 minutes (300,000 ms)
const timeoutId = setTimeout(() => {
  console.error('⏰ FAILURE: Test timed out after 5 minutes.');
  child.kill();
  process.exit(1);
}, 300000);

child.on('close', (code) => {
  clearTimeout(timeoutId);
  console.log(`\n--- Script execution completed with code ${code} ---`);

  if (code !== 0) {
    console.error('❌ FAILURE: Your script exited with a non-zero code.');
    process.exit(1);
  }

  // Validation: Check for 200 OK and Signature header
  if (!outputBuffer.includes('200') || !outputBuffer.includes('signature:')) {
    console.error('❌ FAILURE: Could not find "200 OK" or "Signature:" in the response dump.');
    console.error('Make sure your script prints the raw HTTP response from the server to standard output.');
    process.exit(1);
  }

  console.log('--- Performing Cryptographic Verifications ---');

  // Extract Digest
  const digestMatch = outputBuffer.match(/^Digest:\s*(.*)$/im);
  if (!digestMatch) {
    console.error('❌ FAILURE: Could not extract "Digest" header from response.');
    process.exit(1);
  }
  const serverDigest = digestMatch[1].trim();
  console.log(`Server Digest: ${serverDigest}`);

  // Extract Signature
  const signatureMatch = outputBuffer.match(/^Signature:\s*(.*)$/im);
  if (!signatureMatch) {
    console.error('❌ FAILURE: Could not extract "Signature" header from response.');
    process.exit(1);
  }
  const serverSignatureHeader = signatureMatch[1].trim();
  console.log(`Server Signature Header: ${serverSignatureHeader}`);

  // Extract Payload from run.sh
  const runShPath = path.resolve(workspacePath, 'run.sh');
  let payloadStr = '';
  let payloadObj = null;

  if (fs.existsSync(runShPath)) {
    const runShContent = fs.readFileSync(runShPath, 'utf8');
    const match = runShContent.match(/PAYLOAD="(\{.*\})"/);
    if (match) {
      payloadStr = match[1].replace(/\\"/g, '"');
      try {
        payloadObj = JSON.parse(payloadStr);
      } catch (e) {
        console.error('❌ FAILURE: Could not parse JSON from PAYLOAD in run.sh');
        process.exit(1);
      }
    }
  }

  if (!payloadObj) {
    console.error('❌ FAILURE: Could not extract PAYLOAD from run.sh. Make sure you define it like PAYLOAD="{\\"code\\": ...}"');
    process.exit(1);
  }

  const author = payloadObj.author;
  if (!author || !/^[^\s@]+@sunnyvale\.it$/.test(author)) {
    console.error('❌ FAILURE: The author must be a valid email address using @sunnyvale.it for the domain part.');
    process.exit(1);
  }

  // Construct expected payload and verify digest
  const expectedDigest = crypto.createHash('sha256').update(payloadStr).digest('base64');
  const expectedDigestStr = `SHA-256=${expectedDigest}`;

  if (serverDigest !== expectedDigestStr) {
    console.error(`❌ FAILURE: Digest mismatch! Expected: ${expectedDigestStr}, Got: ${serverDigest}`);
    process.exit(1);
  }
  console.log('✅ Digest verified successfully!');

  // Extract the actual base64 signature
  const sigValueMatch = serverSignatureHeader.match(/signature="([^"]+)"/);
  if (!sigValueMatch) {
    console.error('❌ FAILURE: Could not extract signature="..." from the Signature header.');
    process.exit(1);
  }
  const actualSignature = sigValueMatch[1];

  // Verify Signature with public key
  const publicKeyPath = path.resolve(__dirname, '..', 'server_public_key.pem');
  if (!fs.existsSync(publicKeyPath)) {
    console.error(`❌ FAILURE: Public key not found at ${publicKeyPath}`);
    process.exit(1);
  }
  const publicKey = fs.readFileSync(publicKeyPath, 'utf8');

  const verifier = crypto.createVerify('sha256');
  verifier.update(serverDigest);
  const isValid = verifier.verify(publicKey, actualSignature, 'base64');

  if (isValid) {
    console.log('✅ Signature verified successfully!');
  } else {
    console.error('❌ FAILURE: Signature verification failed!');
    process.exit(1);
  }

  console.log('🎉 SUCCESS: Public validations passed! You can now submit your solution.');
  process.exit(0);
});
