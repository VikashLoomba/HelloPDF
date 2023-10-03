import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { Chroma } from 'langchain/vectorstores/chroma';
import { ChromaClient, } from 'chromadb';
import type { Document } from 'langchain/document';
import formidable from 'formidable';

export const generateEmbeddings = async (docs: Document<Record<string, any>>[], filename: string) => {
  try {
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();
    // console.log('Chrome URL: ', `http://${btoa(process.env.CHROMA_AUTH_BASIC ?? '')}:${process.env.CHROMA_URL}`);
    const client = new ChromaClient({ path: `http://${process.env.CHROMA_URL}`, auth: {provider: 'token', credentials: process.env.CHROMA_AUTH_TOKEN}});
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

type WithFile = Required<formidable.File>
export const loadDocumentsFromPDF = async (files: formidable.Files) => {
  try {
    console.log('Files passed to loadDocuments: ', files);
    /*load raw docs from the all files in the directory */
    const rawDocs: Document[] = []
    const pdfLoaders = files.files?.filter((fileArray): fileArray is WithFile => !!fileArray).map((file) => new PDFLoader(file.filepath)) ?? [];
    for await (const loader of pdfLoaders) {
      const doc = await loader.load();
      rawDocs.push(...doc);
    }
    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    return docs;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
}