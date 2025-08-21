import { Pinecone } from "@pinecone-database/pinecone";
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
    try {
        const { apiKey, noteId } = await request.json();
        
        // Validate input
        if (!apiKey || noteId === undefined || noteId === null) {
            return json({ error: "Missing required parameters: apiKey and noteId" }, { status: 400 });
        }

        const pc = new Pinecone({ apiKey: apiKey.trim() });
        const index = pc.index("mindnotes-index");

        // First, find all chunks for this note
        const queryResponse = await index.query({
            vector: new Array(1024).fill(0), // Dummy vector
            topK: 1000, // Large number to get all chunks
            includeMetadata: true,
            filter: {
                noteId: { "$eq": parseInt(noteId) }
            }
        });

        if (queryResponse.matches.length === 0) {
            return json({ error: "Note not found" }, { status: 404 });
        }

        // Extract all chunk IDs for this note
        const chunkIds = queryResponse.matches.map(match => match.id);
        
        console.log(`Found ${chunkIds.length} chunks for note ${noteId}`);

        // Delete all chunks for this note
        if (chunkIds.length > 0) {
            await index.deleteMany(chunkIds);
            console.log(`Deleted note ${noteId} with ${chunkIds.length} chunks`);
        }

        return json({ 
            message: "Note deleted successfully!",
            noteId: noteId,
            chunksDeleted: chunkIds.length
        });

    } catch (error) {
        console.error("Error deleting note:", error);
        
        if (error.message?.includes('Unauthorized') || error.status === 401) {
            return json({ error: "Invalid API key" }, { status: 401 });
        }
        
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
            return json({ error: "Index not found. Please reconnect to Pinecone first." }, { status: 404 });
        }
        
        return json({ 
            error: error.message || "Failed to delete note" 
        }, { status: 500 });
    }
}
