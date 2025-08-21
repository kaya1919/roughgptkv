import { Pinecone } from "@pinecone-database/pinecone";
import { json } from "@sveltejs/kit";

// Function to chunk a long text into smaller parts
function chunkText(text, chunkSize = 50) {
    const words = text.split(" ");
    const chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push({ text: words.slice(i, i + chunkSize).join(" ") });
    }
    return chunks.length > 0 ? chunks : [{ text: text }];
}

// Function to get text embeddings
async function getEmbedding(pc, texts) {
    try {
        const response = await pc.inference.embed(
            "multilingual-e5-large", 
            texts.map(d => d.text),
            { inputType: 'passage', truncate: 'END' }
        );
        
        return response.data.map(item => item.values);
    } catch (error) {
        console.error("Error getting embeddings:", error);
        throw new Error("Failed to generate embeddings");
    }
}

export async function POST({ request }) {
    try {
        const { apiKey, note } = await request.json();
        
        // Validate input
        if (!apiKey || !note) {
            return json({ error: "Missing required parameters: apiKey and note" }, { status: 400 });
        }

        if (!note.title || !note.content || !note.category) {
            return json({ error: "Note must have title, content, and category" }, { status: 400 });
        }

        const pc = new Pinecone({ apiKey: apiKey.trim() });
        const index = pc.index("mindnotes-index");

        // Create comprehensive text for embedding
        const fullText = `${note.title} ${note.content}`;
        const chunked = chunkText(fullText);
        
        // Generate embeddings for all chunks
        const vectors = await getEmbedding(pc, chunked);

        // Get current counter
        const fetchResult = await index.fetch(['counter']);
        let noteId = 0;
        
        if (fetchResult.records && fetchResult.records.counter) {
            noteId = (fetchResult.records.counter.metadata?.count || 0) + 1;
        } else {
            noteId = 1;
        }

        // Prepare records for insertion
        const records = [];
        const timestamp = new Date().toISOString();
        
        for (let i = 0; i < vectors.length; i++) {
            records.push({
                id: `note-${noteId}-chunk-${i}`,
                values: vectors[i],
                metadata: { 
                    noteId: noteId,
                    title: note.title,
                    content: note.content,
                    category: note.category,
                    type: note.type || 'note',
                    priority: note.priority || 'medium',
                    chunkIndex: i,
                    totalChunks: vectors.length,
                    fullText: fullText,
                    createdAt: timestamp,
                    isCompleted: note.isCompleted || false
                },
            });
        }

        // Update counter
        const counterVector = vectors[0]; // Use first chunk's vector for counter
        const counterRecord = {
            id: "counter",
            values: counterVector,
            metadata: { 
                count: noteId,
                lastUpdated: timestamp,
                type: 'counter'
            }
        };

        // Insert all records
        await index.upsert([...records, counterRecord]);

        console.log(`Note ${noteId} stored successfully with ${vectors.length} chunks`);
        
        return json({ 
            message: "Note inserted successfully!",
            noteId: noteId,
            chunks: vectors.length,
            category: note.category
        });

    } catch (error) {
        console.error("Error inserting note:", error);
        
        if (error.message?.includes('Unauthorized') || error.status === 401) {
            return json({ error: "Invalid API key" }, { status: 401 });
        }
        
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
            return json({ error: "Index not found. Please reconnect to Pinecone first." }, { status: 404 });
        }
        
        return json({ 
            error: error.message || "Failed to insert note" 
        }, { status: 500 });
    }
}
