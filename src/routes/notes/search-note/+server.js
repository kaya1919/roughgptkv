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
        const { apiKey, query, category, includeCompleted = true, limit = 20 } = await request.json();
        
        // Validate input
        if (!apiKey || !query) {
            return json({ error: "Missing required parameters: apiKey and query" }, { status: 400 });
        }

        const pc = new Pinecone({ apiKey: apiKey.trim() });
        const index = pc.index("mindnotes-index");

        // Generate embedding for search query
        const queryVector = await getEmbedding(pc, [{ text: query }]);

        // Build filter for category and completion status
        let filter = {
            noteId: { "$exists": true }
        };

        if (category && category !== 'all') {
            filter.category = { "$eq": category };
        }

        if (!includeCompleted) {
            filter.isCompleted = { "$eq": false };
        }

        // Perform vector search
        const searchResponse = await index.query({
            vector: queryVector[0],
            topK: Math.min(limit * 3, 100), // Get more results for deduplication
            includeMetadata: true,
            filter: filter
        });

        // Deduplicate by noteId and process results
        const noteMap = new Map();
        const matches = [];

        for (const match of searchResponse.matches) {
            if (match.metadata && match.metadata.noteId) {
                const noteId = match.metadata.noteId;
                
                // Only keep the best match for each note
                if (!noteMap.has(noteId) || match.score > noteMap.get(noteId).score) {
                    noteMap.set(noteId, {
                        id: noteId,
                        title: match.metadata.title,
                        content: match.metadata.content,
                        category: match.metadata.category,
                        type: match.metadata.type || 'note',
                        priority: match.metadata.priority || 'medium',
                        createdAt: match.metadata.createdAt,
                        isCompleted: match.metadata.isCompleted || false,
                        score: match.score
                    });
                }
            }
        }

        // Convert to array and sort by score
        for (const [noteId, note] of noteMap) {
            matches.push(note);
        }

        matches.sort((a, b) => b.score - a.score);

        // Apply final limit
        const limitedMatches = matches.slice(0, limit);

        // If we have matches, apply reranking for better results
        if (limitedMatches.length > 1) {
            try {
                const documents = limitedMatches.map((match, index) => ({
                    id: `doc${index}`,
                    text: `${match.title}: ${match.content}`
                }));

                const rerankResponse = await pc.inference.rerank(
                    'bge-reranker-v2-m3',
                    query,
                    documents,
                    {
                        topN: Math.min(limitedMatches.length, limit),
                        returnDocuments: true,
                        parameters: {
                            truncate: 'END'
                        }
                    }
                );

                // Reorder matches based on reranking
                const rerankedMatches = [];
                for (const rerankedResult of rerankResponse.data) {
                    const docIndex = parseInt(rerankedResult.id.replace('doc', ''));
                    if (docIndex >= 0 && docIndex < limitedMatches.length) {
                        rerankedMatches.push({
                            ...limitedMatches[docIndex],
                            rerankScore: rerankedResult.score
                        });
                    }
                }

                return json({
                    results: rerankedMatches,
                    totalFound: noteMap.size,
                    query: query,
                    category: category,
                    reranked: true
                });

            } catch (rerankError) {
                console.warn("Reranking failed, returning vector search results:", rerankError);
                // Fall back to vector search results if reranking fails
            }
        }

        return json({
            results: limitedMatches,
            totalFound: noteMap.size,
            query: query,
            category: category,
            reranked: false
        });

    } catch (error) {
        console.error("Error searching notes:", error);
        
        if (error.message?.includes('Unauthorized') || error.status === 401) {
            return json({ error: "Invalid API key" }, { status: 401 });
        }
        
        if (error.message?.includes('not found') || error.message?.includes('does not exist')) {
            return json({ error: "Index not found. Please reconnect to Pinecone first." }, { status: 404 });
        }
        
        return json({ 
            error: error.message || "Failed to search notes" 
        }, { status: 500 });
    }
}
