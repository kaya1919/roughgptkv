// Import Pinecone Client
import { Pinecone } from "@pinecone-database/pinecone";
import { json } from "@sveltejs/kit";
// Initialize Pinecone Client


// Function to chunk a long text into smaller parts
function chunkText(text, chunkSize = 30) {
    const words = text.split(" ");
    let chunks = [];
    for (let i = 0; i < words.length; i += chunkSize) {
        chunks.push({ text: words.slice(i, i + chunkSize).join(" ") });
    }
    return chunks;
}

// Function to get text embeddings
async function getEmbedding(pc, texts) {
    let response = await pc.inference.embed(
        "multilingual-e5-large", 
        texts.map(d => d.text),
        {inputType: 'query', truncate: 'END'}
      );
    
        response=response.data;
    
        let n=response.length, i=0 ;
        let arr=[];
        
        for(i=0;i<n;i++)
         {
          arr.push(response[i].values);
         }
         return arr;
    }


// Function to insert a note into Pinecone

export async function POST({ request }) {
    try {
        const { apiKey, fullText } = await request.json();
        const pc = new Pinecone({
            apiKey: apiKey,
        });
        let chunked = [];
        chunked = chunkText(fullText);
        const index = pc.index("rough-man"); // Connect to your Pinecone index
        let vectors = await getEmbedding(pc, chunked);
        const fetchResult = await index.fetch(['count']);
        let noteId = fetchResult.records.count.metadata?.count;
        let records = [];
        for (let i = 0; i < vectors.length; i++) {
            records.push({
                id: `${noteId}-${i}`,
                values: vectors[i],
                metadata: { note_id: noteId, full_text: fullText, chunk_index: i },
            });
        }

        await index.upsert(records);
        await index.upsert([{ id: "count", values: vectors[0], metadata: { count: parseInt(noteId) + 1 } }]);
        console.log("Note stored successfully!");
        return json({ message: `Note inserted successfully!` });
    } catch (error) {
        console.error("Error inserting note:", error);
        return json({ error: error });
    }
}