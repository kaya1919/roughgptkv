import { Pinecone } from "@pinecone-database/pinecone";
import { json } from "@sveltejs/kit";

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

export async function POST({ request }) {
    
    try {
        const { apiKey, cloud, region } = await request.json();

        if (!apiKey || !cloud || !region) {
            return json({ error: "Missing required parameters" }, { status: 400 });
        }

        const pc = new Pinecone({ apiKey });
        const existingIndexes = await pc.listIndexes();
        const indexList = existingIndexes?.indexes ?? [];
        const indexExists = indexList.some(index => index.name === "rough-man");

        if (indexExists) {
           console.log("Index rough-man Already Exists!"); 
        }
        else{
        
        console.log(`Creating index "rough-man"...`);

        await pc.createIndex({
            name: "rough-man",
            dimension: 1024, // Ensure it's a number
            metric: "cosine", // Similarity metric: cosine, euclidean, dot_product
            spec: {
                serverless: {
                    cloud: cloud,
                    region: region
                }
            }
        });
    }
        const index = pc.index("rough-man"); // Connect to your Pinecone index
        let vectors = await getEmbedding(pc, [{ text: "count" }]);
        let records = [{
            id: 'count',
            values: vectors[0],
            metadata: { count: 0 },
        }];
        const fetchResult = await index.fetch(['count']);
        if (fetchResult.records.count) {

        }
        else {
            await index.upsert(records);
        }

        return json({ message: `Index "rough-man" created successfully!` });
    } catch (error) {
        console.error("Error creating index:", error);
        if (error instanceof Error)
            return json({ error: error.message }, { status: 500 });
        else
            return json({ error: "Unknown Error!" });
    }
}
