import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { Chroma } from 'langchain/vectorstores/chroma';
import { COLLECTION_NAME } from '@/config/chroma';
import type { Document } from 'langchain/document';

/* Name of directory to retrieve your files from */
const filePath = 'docs';

export const run = async () => {
  try {
    /*load raw docs from the all files in the directory */
    const docs = await loadDocumentsFromPDF();

    console.log('creating vector store...');
    await generateEmbeddings(docs);
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
};


const generateEmbeddings = async (docs: Document<Record<string, any>>[]) => {
  try {
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();

    let chroma = new Chroma(embeddings, { collectionName: COLLECTION_NAME });
    await chroma.index?.reset();

    await Chroma.fromDocuments(docs, embeddings, {
      collectionName: COLLECTION_NAME,
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
}

const loadDocumentsFromPDF = async () => {
  try {
    /*load raw docs from the all files in the directory */
    const directoryLoader = new DirectoryLoader(filePath, {
      '.pdf': (path) => new PDFLoader(path),
    });

    // const loader = new PDFLoader(filePath);
    const rawDocs = await directoryLoader.load();

    /* Split text into chunks */
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200,
    });

    const docs = await textSplitter.splitDocuments(rawDocs);
    console.log('split docs', docs);
    return docs;
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
}

(async () => {
  await run();
  console.log('ingestion complete');
})();