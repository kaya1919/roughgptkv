import { Pinecone } from "@pinecone-database/pinecone";
import { json } from "@sveltejs/kit";

export async function POST({ request }) {
    try {
        const { apiKey, fullText } = await request.json();
        if (!apiKey || !fullText) {
            return json({ success: false, error: "Missing apiKey or fullText" }, { status: 400 });
        }
        const pc = new Pinecone({ apiKey });
        const index = pc.index("rough-man");

        // Delete all vectors with matching full_text metadata
        await index.deleteMany({ full_text: { $eq: fullText } });

        return json({ success: true });
    } catch (error) {
        console.error("Error deleting note:", error);
        return json({ success: false, error: error.message || String(error) }, { status: 500 });
    }
}
