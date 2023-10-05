import type { NextApiRequest, NextApiResponse } from 'next';
import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { AIMessage, HumanMessage } from 'langchain/schema';
import { CONDENSE_TEMPLATE, QA_TEMPLATE, makeChain } from '@/utils/makechain';
import { COLLECTION_NAME } from '@/config/chroma';
import { Chroma } from 'langchain/vectorstores/chroma';
import { ChromaClient } from 'chromadb';
import { StreamingTextResponse, LangChainStream, Message, OpenAIStream, streamToResponse } from 'ai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { BufferMemory } from 'langchain/memory';
import { CallbackManager } from 'langchain/callbacks';
import { OpenAI } from "langchain/llms/openai";
export const config = {
  api: {
    externalResolver: true,
  },
}
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  
  const { question, history, collectionName, messages } = req.body;
  console.log('req.body', req.body);
  console.log('question', question);
  console.log('history', history);
  console.log('collectionName', collectionName);
  console.log('messages', messages);

  //only accept post requests
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  if (!messages.length) {
    return res.status(400).json({ message: 'No question in the request' });
  }
  const { stream, handlers } = LangChainStream({ onCompletion(completion) {
    console.log('completion', completion);
    res.end(completion)
  }, onStart() {
    console.log('start');
  }, onToken(token) {
    console.log('token', token);
    res.write(token);
  },});


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
    const model = new ChatOpenAI({
      temperature: 0.1, // increase temepreature to get more creative answers
      modelName: 'gpt-4', //change this to gpt-4 if you have access
      streaming: true,
    });
    const questionModel = new ChatOpenAI({});

    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever(),
      {
        // verbose: true,
        questionGeneratorChainOptions: {
          llm: questionModel,
          template: CONDENSE_TEMPLATE,
        },
      }
    );
    // const chain = ConversationalRetrievalQAChain.fromLLM(
    //   model,
    //   vectorStore.asRetriever(),
    //   {
    //     qaTemplate: QA_TEMPLATE,
    //     questionGeneratorTemplate: CONDENSE_TEMPLATE,
    //     returnSourceDocuments: true, //The number of source documents returned is 4 by default
    //     inputKey: 'question',
    //     outputKey: 'text',
    //   },
    // );

    const pastMessages = (messages as Message[]).map(m =>
      m.role == 'user'
        ? new HumanMessage(m.content)
        : new AIMessage(m.content),
    )

    //Ask a question using chat history
    chain.call({
      question: messages[0].content,
      chat_history: pastMessages,
    }, [handlers]);
    
    return streamToResponse(stream, res);
  } catch (error: any) {
    console.log('error', error);
    res.status(500).json({ error: error.message || 'Something went wrong' });
  }
}
