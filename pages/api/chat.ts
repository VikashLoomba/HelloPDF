import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { AIMessage, HumanMessage } from 'langchain/schema';
import { makeChain } from '@/utils/makechain';
import { COLLECTION_NAME } from '@/config/chroma';
import { Chroma } from 'langchain/vectorstores/chroma';
import { ChromaClient } from 'chromadb';

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { question, history, collectionName } = req.body;

  console.log('question', question);
  console.log('history', history);

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!question) {
    return res.status(400).json({ message: 'No question in the request' });
  }
  // OpenAI recommends replacing newlines with spaces for best results
  const sanitizedQuestion = question.trim().replaceAll('\n', ' ');

  try {
    /* create vectorstore*/
    const client = new ChromaClient({ path: `http://${process.env.CHROMA_URL}`, auth: { provider: 'token', credentials: process.env.CHROMA_AUTH_TOKEN } });
    const vectorStore = await Chroma.fromExistingCollection(
      new OpenAIEmbeddings({}),
      {
        url: `http://${btoa(process.env.CHROMA_AUTH_BASIC ?? '')}:${process.env.CHROMA_URL}`,
        index: client,
        collectionName: collectionName ?? COLLECTION_NAME,
      },
    );

    //create chain

    function handleNewToken(token: any) {
      res.write(`${token}`);
    }
    const chain = makeChain(vectorStore, handleNewToken);

    const pastMessages = history.map((message: string, i: number) => {
      if (i % 2 === 0) {
        return new HumanMessage(message);
      } else {
        return new AIMessage(message);
      }
    });

    //Ask a question using chat history
    const response = await chain.call({
      question: sanitizedQuestion,
      chat_history: pastMessages
    });

    console.log('response', response);
    res.end();
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
