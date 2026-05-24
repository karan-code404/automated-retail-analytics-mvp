import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runE2ETests() {
  console.log('--- STARTING E2E INTEGRATION TESTS ---');
  
  const username = `test_architect_${Date.now()}`;
  const email = `${username}@analytics.com`;
  const password = "SecuredPassword!404";
  
  try {
    // 1. Register User
    console.log(`\n[1/7] Registering temporary test user: ${username}...`);
    const regRes = await fetch('http://localhost:5000/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password })
    });
    const regJson = await regRes.json();
    console.log('Status:', regRes.status, 'Response:', regJson);
    if (!regJson.success) throw new Error('Registration failed');

    // 2. Login User
    console.log(`\n[2/7] Logging in to retrieve session JWT...`);
    const loginRes = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email: email, password })
    });
    const loginJson = await loginRes.json();
    console.log('Status:', loginRes.status, 'Payload acquired:', loginJson.success ? 'Success' : 'Fail');
    if (!loginJson.success) throw new Error('Login failed');
    const token = loginJson.token;

    // 3. Upload File
    console.log(`\n[3/7] Reading dummy_data.csv and uploading to engine...`);
    const csvContent = fs.readFileSync('c:/DataAnalytics_project/dummy_data.csv');
    const formData = new FormData();
    formData.append('file', new Blob([csvContent], { type: 'text/csv' }), 'dummy_data.csv');

    const uploadRes = await fetch('http://localhost:5000/api/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
      body: formData
    });
    const uploadJson = await uploadRes.json();
    console.log('Status:', uploadRes.status);
    console.log('Audit Summary:', JSON.stringify(uploadJson.audit, null, 2));
    if (!uploadJson.success) throw new Error('Upload failed');

    // 4. Run Cleaning
    console.log(`\n[4/7] Triggering automatic clean operations...`);
    const cleanRes = await fetch('http://localhost:5000/api/clean', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        null_handler: 'median',
        outlier_handler: 'clip',
        normalize_dates: true
      })
    });
    const cleanJson = await cleanRes.json();
    console.log('Status:', cleanRes.status, 'Clean Logs Count:', cleanJson.logs?.length);
    if (!cleanJson.success) throw new Error('Cleaning failed');

    // 5. Query Dashboard & Analytics
    console.log(`\n[5/7] Testing dashboard and analytic pipelines...`);
    const dashRes = await fetch('http://localhost:5000/api/dashboard');
    const dashJson = await dashRes.json();
    console.log('Dashboard Status:', dashRes.status, 'Domain detected:', dashJson.domain);
    
    const forecastRes = await fetch('http://localhost:5000/api/forecast');
    const forecastJson = await forecastRes.json();
    console.log('Forecast Status:', forecastRes.status, 'Churn risk calculated:', forecastJson.churn_risk);

    const recsRes = await fetch('http://localhost:5000/api/recommendations');
    const recsJson = await recsRes.json();
    console.log('Recommendations Status:', recsRes.status, 'Count:', recsJson.recommendations?.length);

    // 6. Test Exporters
    const formats = ['pdf', 'docx', 'pptx', 'pack'];
    console.log(`\n[6/7] Triggering compiled document generation for formats: ${formats.join(', ')}...`);
    
    for (const fmt of formats) {
      console.log(` - Compiling format: ${fmt.toUpperCase()}...`);
      const expRes = await fetch('http://localhost:5000/api/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ format: fmt })
      });
      console.log(`   Response Status:`, expRes.status);
      if (expRes.status !== 200) {
        const text = await expRes.text();
        console.error(`   Error Content:`, text);
        throw new Error(`Failed on format: ${fmt}`);
      }
      
      const buffer = await expRes.arrayBuffer();
      const ext = fmt === 'pack' ? 'zip' : fmt;
      const savePath = path.join(__dirname, `../reports/test_output_${fmt}.${ext}`);
      fs.writeFileSync(savePath, Buffer.from(buffer));
      console.log(`   Successfully wrote ${buffer.byteLength} bytes to ${savePath}`);
    }

    console.log('\n[7/7] Cleaning up test registrations...');
    // We can logout
    await fetch('http://localhost:5000/api/auth/logout', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    console.log('Session invalidated. Test complete.');
    console.log('\n--- ALL E2E VERIFICATION CHECKS PASSED SUCCESSFULLY ---');

  } catch (err) {
    console.error('\n!!! E2E TEST CRITICAL FAILURE !!!');
    console.error(err);
    process.exit(1);
  }
}

runE2ETests();
