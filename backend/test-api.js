const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPass123'
};

let authToken = '';

// Test functions
async function testHealthCheck() {
  try {
    console.log('🏥 Testing health check...');
    const response = await axios.get(`${BASE_URL}/health`);
    console.log('✅ Health check passed:', response.data);
    return true;
  } catch (error) {
    console.error('❌ Health check failed:', error.message);
    return false;
  }
}

async function testSignup() {
  try {
    console.log('\n📝 Testing user signup...');
    const response = await axios.post(`${BASE_URL}/auth/signup`, testUser);
    console.log('✅ Signup successful:', response.data.message);
    authToken = response.data.data.token;
    return true;
  } catch (error) {
    if (error.response?.status === 409) {
      console.log('⚠️  User already exists, proceeding with signin...');
      return await testSignin();
    }
    console.error('❌ Signup failed:', error.response?.data || error.message);
    return false;
  }
}

async function testSignin() {
  try {
    console.log('\n🔐 Testing user signin...');
    const response = await axios.post(`${BASE_URL}/auth/signin`, {
      email: testUser.email,
      password: testUser.password
    });
    console.log('✅ Signin successful:', response.data.message);
    authToken = response.data.data.token;
    return true;
  } catch (error) {
    console.error('❌ Signin failed:', error.response?.data || error.message);
    return false;
  }
}

async function testTokenVerification() {
  try {
    console.log('\n🔍 Testing token verification...');
    const response = await axios.get(`${BASE_URL}/auth/verify`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Token verification successful:', response.data.message);
    return true;
  } catch (error) {
    console.error('❌ Token verification failed:', error.response?.data || error.message);
    return false;
  }
}

async function testImageGeneration() {
  try {
    console.log('\n🎨 Testing image generation...');
    const response = await axios.post(`${BASE_URL}/images/generate`, {
      prompt: 'a beautiful sunset over mountains',
      style: 'realistic',
      size: '1024x1024'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Image generation successful:', response.data.message);
    console.log('📸 Generated image ID:', response.data.data.image_id);
    return response.data.data.image_id;
  } catch (error) {
    console.error('❌ Image generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetUserImages() {
  try {
    console.log('\n📚 Testing get user images...');
    const response = await axios.get(`${BASE_URL}/images/my-images`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get user images successful');
    console.log('📊 Total images:', response.data.data.count);
    return true;
  } catch (error) {
    console.error('❌ Get user images failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetUserProfile() {
  try {
    console.log('\n👤 Testing get user profile...');
    const response = await axios.get(`${BASE_URL}/users/profile`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get user profile successful');
    console.log('👤 User name:', response.data.data.name);
    console.log('📧 User email:', response.data.data.email);
    return true;
  } catch (error) {
    console.error('❌ Get user profile failed:', error.response?.data || error.message);
    return false;
  }
}

async function testGetUserStats() {
  try {
    console.log('\n📈 Testing get user stats...');
    const response = await axios.get(`${BASE_URL}/users/stats`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    console.log('✅ Get user stats successful');
    console.log('📊 Total images:', response.data.data.total_images);
    console.log('🎯 Remaining images:', response.data.data.remaining_images);
    console.log('💎 Subscription tier:', response.data.data.subscription_tier);
    return true;
  } catch (error) {
    console.error('❌ Get user stats failed:', error.response?.data || error.message);
    return false;
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting API tests...\n');
  
  const tests = [
    { name: 'Health Check', fn: testHealthCheck },
    { name: 'User Signup/Signin', fn: testSignup },
    { name: 'Token Verification', fn: testTokenVerification },
    { name: 'Image Generation', fn: testImageGeneration },
    { name: 'Get User Images', fn: testGetUserImages },
    { name: 'Get User Profile', fn: testGetUserProfile },
    { name: 'Get User Stats', fn: testGetUserStats }
  ];

  let passedTests = 0;
  let totalTests = tests.length;

  for (const test of tests) {
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
      }
    } catch (error) {
      console.error(`❌ ${test.name} test error:`, error.message);
    }
  }

  console.log('\n📊 Test Results:');
  console.log(`✅ Passed: ${passedTests}/${totalTests}`);
  console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
  
  if (passedTests === totalTests) {
    console.log('\n🎉 All tests passed! Your backend is working correctly.');
  } else {
    console.log('\n⚠️  Some tests failed. Please check your setup.');
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 