import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { Chroma } from 'langchain/vectorstores/chroma';
import { ChromaClient, } from 'chromadb';
import { Document } from 'langchain/document';

export const generateEmbeddings = async (docs: Document<Record<string, any>>[], filename: string) => {
    try {
        /*create and store the embeddings in the vectorStore*/
        const embeddings = new OpenAIEmbeddings();
        // console.log('Chrome URL: ', `http://${btoa(process.env.CHROMA_AUTH_BASIC ?? '')}:${process.env.CHROMA_URL}`);
        const client = new ChromaClient({ path: `http://${process.env.CHROMA_URL}`, auth: { provider: 'token', credentials: process.env.CHROMA_AUTH_TOKEN } });
        return await Chroma.fromDocuments(docs, embeddings, {
            url: `http://${btoa(process.env.CHROMA_AUTH_BASIC ?? '')}:${process.env.CHROMA_URL}`,
            collectionName: filename,
            index: client,
        });
    } catch (error) {
        console.log('error', error);
        throw new Error('Failed to ingest your data');
    }
}

export const loadDocumentsFromPDF = async (files: File[]) => {
    try {
        console.log('Files passed to loadDocuments: ', files);
        const filteredFiles = files?.filter((file) => !!file);
        const flattenedDocs = await Promise.all(filteredFiles.map(async (file) => {
            const doc = new PDFLoader(file, { splitPages: false });
            const loadedDocs = await doc.load();
            loadedDocs.map((doc) => doc.metadata.source = file.name);
            return loadedDocs;
        })) ?? [];
        /* Split text into chunks */
        const textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 200,
        });
        const docs = textSplitter.splitDocuments(flattenedDocs.flat())
        return docs;
    } catch (error) {
        console.log('error', error);
        throw new Error('Failed to ingest your data');
    }
}