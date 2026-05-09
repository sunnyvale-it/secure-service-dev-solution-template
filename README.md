# Secure Service Developer Template

This repository provides the starting template for the **Secure Service Developer** challenge.

## Challenge Goal
You must build an HTTP Client in your preferred programming language. Your client must send an HTTP POST request to a secure target web service containing a specific JSON payload. The request must be cryptographically signed using **HTTP Signatures** with the `rsa-sha256` algorithm.

## Files
- `run.sh`: **This is the mandatory entry point.** The automated grader will execute this script. You should place your commands to run your solution inside this file.
- `tests/public_test.js`: A local script you can use to verify that your implementation successfully calls the web service and dumps the required output.

## How to Test Locally
1. Implement your solution in your preferred language.
2. Update `run.sh` to execute your solution.
3. Ensure your script outputs the raw HTTP response from the server to standard output (it must contain at least \`200\` and the \`signature:\` header).
4. Run the local public tests to verify your structure:
   \`\`\`bash
   npm test
   \`\`\`

*(Note: The actual grading will inject a production \`API_URL\` and perform additional identity/attempt-code verification on your output).*
