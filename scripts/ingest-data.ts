import { RecursiveCharacterTextSplitter } from 'langchain/text_splitter';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { DirectoryLoader } from 'langchain/document_loaders/fs/directory';
import { PDFLoader } from 'langchain/document_loaders/fs/pdf'
import { Chroma } from 'langchain/vectorstores/chroma';
import { COLLECTION_NAME } from '@/config/chroma';
import type { Document } from 'langchain/document';
import formidable from 'formidable';

/* Name of directory to retrieve your files from */
const filePath = 'docs';

// export const run = async () => {
//   try {
//     /*load raw docs from the all files in the directory */
//     const docs = await loadDocumentsFromPDF();

//     console.log('creating vector store...');
//     await generateEmbeddings(docs);
//   } catch (error) {
//     console.log('error', error);
//     throw new Error('Failed to ingest your data');
//   }
// };


export const generateEmbeddings = async (docs: Document<Record<string, any>>[], filename: string) => {
  try {
    /*create and store the embeddings in the vectorStore*/
    const embeddings = new OpenAIEmbeddings();

    return await Chroma.fromDocuments(docs, embeddings, {
      collectionName: filename,
    });
  } catch (error) {
    console.log('error', error);
    throw new Error('Failed to ingest your data');
  }
}

// export const loadDocumentsFromPDF = async () => {
//   try {
//     /*load raw docs from the all files in the directory */
//     const directoryLoader = new DirectoryLoader(filePath, {
//       '.pdf': (path) => new PDFLoader(path),
//     });

//     // const loader = new PDFLoader(filePath);
//     const rawDocs = await directoryLoader.load();

//     /* Split text into chunks */
//     const textSplitter = new RecursiveCharacterTextSplitter({
//       chunkSize: 1000,
//       chunkOverlap: 200,
//     });

//     const docs = await textSplitter.splitDocuments(rawDocs);
//     console.log('split docs', docs);
//     return docs;
//   } catch (error) {
//     console.log('error', error);
//     throw new Error('Failed to ingest your data');
//   }
// }
type WithFile = Required<formidable.File[]>
export const loadDocumentsFromPDF = async (files: formidable.Files) => {
  try {
    console.log('Files passed to loadDocuments: ', files);
    /*load raw docs from the all files in the directory */
    const rawDocs: Document[] = []
    const pdfLoaders = Object.values(files).filter((pdfBlob): pdfBlob is WithFile => !!pdfBlob).map((pdfBlob) => new PDFLoader(pdfBlob[0].filepath));
    for await (const loader of pdfLoaders) {
      const doc = await loader.load();
      console.log('for...loop docs: ', doc);
      rawDocs.push(...doc);
    }
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

// (async () => {
//   await run();
//   console.log('ingestion complete');
// })();