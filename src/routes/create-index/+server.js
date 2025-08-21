import { Pinecone } from "@pinecone-database/pinecone";
import { json } from "@sveltejs/kit";

// Function to get text embeddings
async function getEmbedding(pc, texts) {
    try {
        const response = await pc.inference.embed(
            "multilingual-e5-large", 
            texts.map(d => d.text),
            { inputType: 'query', truncate: 'END' }
        );
        
        return response.data.map(item => item.values);
    } catch (error) {
        console.error("Error getting embeddings:", error);
        throw new Error("Failed to generate embeddings");
    }
}

export async function POST({ request }) {
    try {
        const { apiKey, cloud, region } = await request.json();

        // Validate required parameters
        if (!apiKey || !cloud || !region) {
            return json({ error: "Missing required parameters: apiKey, cloud, and region are required" }, { status: 400 });
        }

        // Validate API key format
        if (typeof apiKey !== 'string' || apiKey.trim().length < 20) {
            return json({ error: "Invalid API key format" }, { status: 400 });
        }

        // Initialize Pinecone client
        const pc = new Pinecone({ apiKey: apiKey.trim() });
        
        // Test the connection first
        try {
            await pc.listIndexes();
        } catch (error) {
            console.error("Pinecone connection failed:", error);
            if (error.message?.includes('Unauthorized') || error.status === 401) {
                return json({ error: "Invalid API key. Please check your Pinecone API key." }, { status: 401 });
            }
            if (error.message?.includes('Forbidden') || error.status === 403) {
                return json({ error: "Access denied. Please verify your Pinecone account permissions." }, { status: 403 });
            }
            return json({ error: "Failed to connect to Pinecone. Please check your configuration." }, { status: 500 });
        }

        const existingIndexes = await pc.listIndexes();
        const indexList = existingIndexes?.indexes ?? [];
        const indexExists = indexList.some(index => index.name === "mindnotes-index");

        if (indexExists) {
            console.log("Index 'mindnotes-index' already exists!");
        } else {
            console.log("Creating index 'mindnotes-index'...");

            // Validate cloud and region combination
            const validCombinations = {
                'aws': ['us-east-1', 'us-west-2', 'eu-west-1'],
                'gcp': ['us-central1', 'us-east1', 'europe-west1'],
                'azure': ['eastus', 'westus2', 'northeurope']
            };

            if (!validCombinations[cloud]?.includes(region)) {
                return json({ 
                    error: `Invalid region "${region}" for cloud provider "${cloud}". Valid regions for ${cloud}: ${validCombinations[cloud]?.join(', ') || 'none available'}` 
                }, { status: 400 });
            }

            try {
                await pc.createIndex({
                    name: "mindnotes-index",
                    dimension: 1024,
                    metric: "cosine",
                    spec: {
                        serverless: {
                            cloud: cloud,
                            region: region
                        }
                    }
                });
            } catch (error) {
                console.error("Error creating index:", error);
                if (error.message?.includes('already exists')) {
                    // Index was created between our check and creation attempt
                    console.log("Index was created concurrently");
                } else if (error.message?.includes('quota') || error.message?.includes('limit')) {
                    return json({ error: "Pinecone account quota exceeded. Please check your plan limits." }, { status: 429 });
                } else {
                    return json({ error: `Failed to create index: ${error.message}` }, { status: 500 });
                }
            }
        }

        // Initialize the index and create counter if needed
        try {
            const index = pc.index("mindnotes-index");
            
            // Check if counter exists
            const fetchResult = await index.fetch(['counter']);
            
            if (!fetchResult.records || !fetchResult.records.counter) {
                // Create initial counter
                const vectors = await getEmbedding(pc, [{ text: "counter initialization" }]);
                const records = [{
                    id: 'counter',
                    values: vectors[0],
                    metadata: { 
                        count: 0,
                        type: 'counter',
                        created: new Date().toISOString()
                    },
                }];
                
                await index.upsert(records);
                console.log("Counter initialized successfully");
            }
        } catch (error) {
            console.error("Error initializing counter:", error);
            // Don't fail the entire connection for counter issues
        }

        return json({ 
            message: "Successfully connected to Mind Notes!",
            indexName: "mindnotes-index",
            cloud: cloud,
            region: region
        });

    } catch (error) {
        console.error("Error in create-index:", error);
        
        // Return appropriate error messages
        if (error.message?.includes('network') || error.message?.includes('fetch')) {
            return json({ error: "Network error. Please check your internet connection and try again." }, { status: 503 });
        }
        
        if (error instanceof TypeError) {
            return json({ error: "Invalid configuration. Please check your input values." }, { status: 400 });
        }

        return json({ 
            error: error.message || "An unexpected error occurred. Please try again." 
        }, { status: 500 });
    }
}
