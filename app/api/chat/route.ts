import { OpenAIEmbeddings } from 'langchain/embeddings/openai';
import { AIMessage, HumanMessage, SystemMessage } from 'langchain/schema';
import { CONDENSE_TEMPLATE, QA_TEMPLATE } from './utilities';
import { COLLECTION_NAME } from '@/config/chroma';
import { Chroma } from 'langchain/vectorstores/chroma';
import { ChromaClient } from 'chromadb';
import { StreamingTextResponse, LangChainStream, Message } from 'ai';
import { ConversationalRetrievalQAChain } from 'langchain/chains';
import { ChatOpenAI } from 'langchain/chat_models/openai';
import { NextRequest, NextResponse } from 'next/server';
import { PromptTemplate } from 'langchain/prompts';
import { BufferMemory, ChatMessageHistory } from 'langchain/memory';
import { Document } from 'langchain/document';

export async function POST(req: NextRequest) {
  const data = await req.json();

  if (!data.messages.length) {
    return NextResponse.json({ message: 'No question in the request' }, { status: 400 });
  }
  const { stream, handlers } = LangChainStream();


  try {
    const { collectionName, messages } = data;
    console.log("Received Messages: ", messages);

    const chatHistory = new ChatMessageHistory(
      messages.map((m: Message) => {
        if (m.role === "user") {
          return new HumanMessage(m.content);
        }
        if (m.role === "system") {
          return new SystemMessage(m.content);
        }
        return new AIMessage(m.content);
      })
    );
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
      callbacks: [handlers]
    });
    const questionModel = new ChatOpenAI({
      modelName: 'gpt-4', //change this to gpt-4 if you have access
      // streaming: true,
    });
    let resolveWithDocuments: (value: Document[]) => void;
    const documentPromise = new Promise<Document[]>((resolve) => {
      resolveWithDocuments = resolve;
    });
    
    const chain = ConversationalRetrievalQAChain.fromLLM(
      model,
      vectorStore.asRetriever({
        callbacks: [
          {
            handleRetrieverEnd(documents) {
              resolveWithDocuments(documents);
            },
          },
        ]
      }),
      {
        // verbose: true,
        memory: new BufferMemory({
          memoryKey: "chat_history",
          inputKey: "question", // The key for the input to the chain
          outputKey: "text",
          returnMessages: true, // If using with a chat model
          chatHistory: chatHistory,
        }),
        questionGeneratorChainOptions: {
          llm: questionModel,
          template: CONDENSE_TEMPLATE,
        },
        qaChainOptions: { type: 'stuff', prompt: PromptTemplate.fromTemplate(QA_TEMPLATE), verbose: true },
        returnSourceDocuments: true, //The number of source documents returned is 4 by default
      }
    );

    const pastMessages = (messages as Message[]).map(m =>
      m.role == 'user'
        ? new HumanMessage(m.content)
        : new AIMessage(m.content),
    )

    //Ask a question using chat history
    chain.call({
      question: messages[messages.length - 1].content,
      chat_history: pastMessages,
    });
    const documents = documentPromise;
    const serializedSources = Buffer.from(
      JSON.stringify(
        (await documents).map((doc) => {
          console.log('Doc : ', doc);
          return {
            pageContent: doc.pageContent.slice(0, 150) + "...",
            metadata: { ...doc.metadata },
          };
        }),
      ),
    ).toString("base64");
    return new StreamingTextResponse(stream, {
      headers: {
        "x-message-index": (messages.length + 1).toString(),
        "x-sources": serializedSources,
      }});
  } catch (error: any) {
    console.log('error', error);
    return NextResponse.json({ message: `Fatal Error: ${JSON.stringify(error)}` }, { status: 500 });
  }
}
