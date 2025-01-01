import { generateGameAgent, loadGameAgent } from '../services/gameAgentManager.js';

async function testGameAgent() {
    try {
        console.log('Testing game agent generation...');
        
        const testInput = {
            theme: "haunted spaceship",
            goal: "escape",
            antagonist: "space monster"
        };

        // Generate game agent
        console.log('Generating game agent with input:', testInput);
        const gameAgent = await generateGameAgent(testInput);
        console.log('Generated game agent:', JSON.stringify(gameAgent, null, 2));

        // Load the generated agent
        console.log('\nTesting game agent loading...');
        const loadedAgent = await loadGameAgent(gameAgent.name);
        console.log('Loaded game agent memories:', JSON.stringify(loadedAgent.memories, null, 2));

        console.log('\nAll tests completed successfully!');
    } catch (error) {
        console.error('Test failed:', error);
    }
}

// Run the test
testGameAgent(); 