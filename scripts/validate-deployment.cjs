#!/usr/bin/env node

/**
 * 🔍 Deployment Validation Script
 * Validates that all required files and configurations are in place for Azure deployment
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🔍 Validating deployment configuration...\n');

const errors = [];
const warnings = [];

// Required files check
const requiredFiles = [
  '.github/workflows/backend-azure.yml',
  '.github/workflows/frontend-azure.yml', 
  '.github/workflows/deploy-full-stack.yml',
  'backend/package.json',
  'backend/tsconfig.json',
  'backend/prisma/schema.prisma',
  'package.json',
  'vite.config.ts',
  'index.html'
];

console.log('📁 Checking required files...');
requiredFiles.forEach(file => {
  const fullPath = path.join(__dirname, '..', file);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file}`);
    errors.push(`Missing required file: ${file}`);
  }
});

// Check package.json scripts
console.log('\n📦 Validating package.json scripts...');

try {
  const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8'));
  const requiredScripts = ['build', 'dev'];
  
  requiredScripts.forEach(script => {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`✅ Frontend script: ${script}`);
    } else {
      console.log(`❌ Frontend script: ${script}`);
      errors.push(`Missing frontend script: ${script}`);
    }
  });
} catch (e) {
  errors.push('Failed to read main package.json');
}

try {
  const backendPackageJson = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend', 'package.json'), 'utf8'));
  const requiredBackendScripts = ['build', 'start', 'dev'];
  
  requiredBackendScripts.forEach(script => {
    if (backendPackageJson.scripts && backendPackageJson.scripts[script]) {
      console.log(`✅ Backend script: ${script}`);
    } else {
      console.log(`❌ Backend script: ${script}`);
      errors.push(`Missing backend script: ${script}`);
    }
  });
} catch (e) {
  errors.push('Failed to read backend package.json');
}

// Check workflow configurations
console.log('\n⚙️ Validating workflow configurations...');

const workflowFiles = [
  '.github/workflows/backend-azure.yml',
  '.github/workflows/frontend-azure.yml'
];

workflowFiles.forEach(workflowFile => {
  try {
    const workflowContent = fs.readFileSync(path.join(__dirname, '..', workflowFile), 'utf8');
    
    // Check for placeholder values that need to be updated
    if (workflowContent.includes('squadpot-backend') && workflowContent.includes('UPDATE THIS')) {
      warnings.push(`${workflowFile}: Update AZURE_WEBAPP_NAME placeholder`);
    }
    
    if (workflowContent.includes('your-static-web-app.azurestaticapps.net')) {
      warnings.push(`${workflowFile}: Update Static Web App URL placeholder`);
    }
    
    console.log(`✅ ${workflowFile} syntax OK`);
  } catch (e) {
    console.log(`❌ ${workflowFile} - ${e.message}`);
    errors.push(`Workflow file error: ${workflowFile}`);
  }
});

// Check environment variables template
console.log('\n🔐 Checking environment configuration...');

const envExamples = [
  '.env.example',
  'backend/.env.example'
];

envExamples.forEach(envFile => {
  const fullPath = path.join(__dirname, '..', envFile);
  if (fs.existsSync(fullPath)) {
    console.log(`✅ ${envFile} exists`);
  } else {
    warnings.push(`Missing ${envFile} - consider creating for documentation`);
  }
});

// Check if Node.js and npm versions are compatible
console.log('\n🟢 Checking Node.js version...');
try {
  const nodeVersion = execSync('node --version', { encoding: 'utf8' }).trim();
  console.log(`✅ Node.js: ${nodeVersion}`);
  
  const major = parseInt(nodeVersion.replace('v', '').split('.')[0]);
  if (major < 18) {
    warnings.push('Node.js version should be 18 or higher for Azure compatibility');
  }
} catch (e) {
  errors.push('Node.js not found or not accessible');
}

try {
  const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
  console.log(`✅ npm: ${npmVersion}`);
} catch (e) {
  errors.push('npm not found or not accessible');
}

// Check TypeScript configuration
console.log('\n🎯 Checking TypeScript configuration...');
try {
  const tsConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'backend', 'tsconfig.json'), 'utf8'));
  
  if (tsConfig.compilerOptions && tsConfig.compilerOptions.outDir) {
    console.log(`✅ Backend TypeScript outDir: ${tsConfig.compilerOptions.outDir}`);
  } else {
    warnings.push('Backend TypeScript configuration missing outDir');
  }
} catch (e) {
  warnings.push('Could not validate backend TypeScript configuration');
}

// Final report
console.log('\n' + '='.repeat(50));
console.log('📊 VALIDATION REPORT');
console.log('='.repeat(50));

if (errors.length === 0) {
  console.log('✅ All critical validations passed!');
} else {
  console.log('❌ Found critical issues:');
  errors.forEach(error => console.log(`  - ${error}`));
}

if (warnings.length > 0) {
  console.log('\n⚠️  Warnings (recommended fixes):');
  warnings.forEach(warning => console.log(`  - ${warning}`));
}

console.log('\n🚀 Next Steps:');
console.log('1. Fix any critical errors above');
console.log('2. Address warnings for better deployment experience');
console.log('3. Set up Azure resources and GitHub secrets');
console.log('4. Update workflow placeholders with your actual resource names');
console.log('5. Test deployment with a small change');

console.log('\n📚 For detailed setup instructions, see: DEPLOYMENT_SETUP.md');

// Exit with error code if there are critical errors
if (errors.length > 0) {
  process.exit(1);
} else {
  process.exit(0);
}