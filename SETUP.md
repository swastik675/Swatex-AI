# Swatex AI — Setup & Installation Guide
**Tagline:** Code Smarter. Debug Faster.

Follow these simple steps to run Swatex AI locally on your system.

## Prerequisites
- **Node.js**: v18.0.0 or later (v24+ recommended)
- **npm**: v9.0.0 or later
- **Python**: v3.9 or later (for sample microservice tests)
- **Git**: Installed

---

## Step 1: Install Dependencies

From the repository root directory:
```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Return to root
cd ..
```

---

## Step 2: Environment Configuration (Optional)
If you wish to use live Amazon Bedrock AI reasoning:
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Open `.env` and fill in your AWS credentials and region:
   ```env
   AWS_REGION=us-east-1
   AWS_ACCESS_KEY_ID=your-access-key-id
   AWS_SECRET_ACCESS_KEY=your-secret-access-key
   AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
   ```
3. *If AWS credentials are NOT provided, Swatex AI automatically runs in high-fidelity Local Demo Mode using the exact same real MCP tools and real test execution.*

---

## Step 3: Run Automated Tests
Verify that all security, MCP, and workflow tests pass:
```bash
cd backend
npm test
```
All 20 test cases will execute and pass.

---

## Step 4: Launch Swatex AI

### Terminal 1: Start Backend Server
```bash
cd backend
npm run dev
```
Backend will start on `http://localhost:4000`:
- REST API: `http://localhost:4000/api/health`
- MCP Streamable HTTP: `http://localhost:4000/mcp`
- MCP SSE Endpoint: `http://localhost:4000/mcp/sse`

### Terminal 2: Start Frontend Web App
```bash
cd frontend
npm run dev
```
Frontend will be accessible at:
```
http://localhost:5173
```

---

## Step 5: Test the Workflow
1. Open `http://localhost:5173` in your browser.
2. Click **"Full Hackathon Workflow"** or enter:
   *"Find the bug, explain its cause, propose a fix, and run the tests."*
3. Watch the autonomous investigation discover the defect in `src/pricing.py:29`.
4. Inspect the proposed diff in the **Patch Review** tab.
5. Click **"Approve & Apply Patch"**.
6. Observe the live unit tests execute and pass with exit code 0!
7. Click **"Reset Sample Bug"** anytime in the sidebar to reset the sample project back to its seeded bug state.
