import { generateEmbeddings, loadDocumentsFromPDF } from "./utilities";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
    req: NextRequest,
) {

    //only accept post requests
    if (req.method !== 'POST') {
        return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
    }

    const formData = await req.formData();
    const files = formData.getAll('files') as File[];
    console.log('Files: ', files);
    if(!files) {
        return NextResponse.json({ error: 'No files in the request' }, { status: 400 });
    }
    try {
        const newFilename = formData.get('collectionName')?.toString() ?? `${files[0].size}_${files[0].lastModified}`;
        const docs = await loadDocumentsFromPDF(files);
        // generate embeddings from docs
        const generatedEmbeddings = await generateEmbeddings(docs, newFilename ?? 'defaultCollection');
        //Ask a question using chat history
        const response = generatedEmbeddings.collectionName
        return NextResponse.json(response, { status: 200 });
    } catch (error: any) {
        console.log('error', error);
        return NextResponse.json({ error: error.message || 'Something went wrong' }, { status: 500 });
    }
}

