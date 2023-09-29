import { generateEmbeddings, loadDocumentsFromPDF } from "@/scripts/ingest-data";
import { handleFile } from "../../utils/handleFile";
import { NextApiRequest, NextApiResponse, PageConfig } from "next";

export async function handler(
    req: NextApiRequest,
    res: NextApiResponse,
) {

    //only accept post requests
    if (req.method !== 'POST') {
        res.status(405).json({ error: 'Method not allowed' });
        return;
    }

    const { files, fields } = await handleFile(req)
    console.log('Files: ', files);
    console.log('Fields: ', fields);
    
    try {
        const newFilename = Object.keys(files).map((key) => files[key]?.[0]?.newFilename)[0];
        const docs = await loadDocumentsFromPDF(files);
        // generate embeddings from docs
        const generatedEmbeddings = await generateEmbeddings(docs, newFilename ?? 'defaultCollection');
        //Ask a question using chat history
        const response = generatedEmbeddings.collectionName

        console.log('Saved Embeddings to collection: ', response);
        res.status(200).json(response);
    } catch (error: any) {
        console.log('error', error);
        res.status(500).json({ error: error.message || 'Something went wrong' });
    }
}

export const config: PageConfig = {
    api: {
        bodyParser: false,
    },
};

export default handler
