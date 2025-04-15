// Simple test script to verify Replicate integration
const Replicate = require('replicate');

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

// Test the connection with a simple model
async function testReplicate() {
  try {
    console.log('Testing Replicate connection...');
    
    // Use a simple text-to-text model for testing the connection
    const output = await replicate.run(
      "meta/llama-2-7b-chat:f1d50bb24186c52daae319ca8366e53debdaa9e0ae7ff976e918df752732ccc4",
      {
        input: {
          prompt: "Tell me a short fun fact about AI art in one sentence."
        }
      }
    );
    
    console.log('Replicate connection successful!');
    console.log('Response:', output);
    
    return true;
  } catch (error) {
    console.error('Error connecting to Replicate:', error.message);
    if (error.response) {
      console.error('Response status:', error.response.status);
      console.error('Response data:', error.response.data);
    }
    return false;
  }
}

// Run the test
testReplicate()
  .then(success => {
    if (success) {
      console.log('✅ Test completed successfully');
    } else {
      console.log('❌ Test failed');
    }
  });