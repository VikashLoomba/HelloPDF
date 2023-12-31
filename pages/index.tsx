import { useRef, useState, useEffect, ReactNode } from 'react';
import Layout from '@/components/layout';
import styles from '@/styles/Home.module.css';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import LoadingDots from '@/components/ui/LoadingDots';
import { Document } from 'langchain/document';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import FileUploadComponent from './components/FileUploadComponent';
import { useChat } from 'ai/react';

import type { FileWithHandle } from 'browser-fs-access'

export default function Home() {
  const messageListRef = useRef<HTMLDivElement>(null);
  const [sourcesForMessages, setSourcesForMessages] = useState<Record<string, any>>({});
  const [collectionName, setCollectionName] = useState<string | null>(null);
  const [files, setFiles] = useState<FileWithHandle[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [fileError, setFileError] = useState<Error | null>(null);
  const { messages, input, handleInputChange, handleSubmit, data, isLoading, error, } = useChat({
    api: '/api/chat', body: { collectionName }, headers: { 'Content-Type': 'application/json' },
    onResponse(response) {
      console.log("Response: ", response)
      const sourcesHeader = response.headers.get("x-sources");
      const sources = sourcesHeader ? JSON.parse(atob(sourcesHeader)) : [];
      const messageIndexHeader = response.headers.get("x-message-index");
      if (sources.length && messageIndexHeader !== null) {
        setSourcesForMessages({ ...sourcesForMessages, [messageIndexHeader]: sources });
      }
    },
  })
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => messageListRef.current?.scrollIntoView({behavior: 'smooth'}), [isLoading, messageListRef, messages])

  useEffect(() => {
    textAreaRef.current?.focus();
  }, []);

  useEffect(() => console.log('data: ', data), [data])

  const handleEnter = (e: any) => {
    if (e.key === 'Enter' && input) {
      console.log('Submitting Input: ', input);
      handleSubmit(e);
    } else if (e.key == 'Enter') {
      e.preventDefault();
    }
  };

  const handleSubmitFiles = async () => {
    setLoading(true);
    const postData = new FormData();
    files.forEach((file) => {
      postData.append('files', file);
    });
    if(collectionName) {postData.append('collectionName', collectionName);}
    try {
      const res = await fetch('/api/file', {
        method: 'POST',
        body: postData,
      });
      const name = await res.json();
      if(!collectionName) {
        setCollectionName(name);
      }
      setFileError(null);
      setLoading(false);
    } catch (error) {
      console.log(error);
      console.error('Error submitting files:', error);
      setFileError(error as Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Layout>
        <div className="mx-auto flex flex-col gap-4">
          <h1 className="text-2xl font-bold leading-[1.1] tracking-tighter text-center">
            Chat With Your Docs
          </h1>
          <main className={`${styles.main} space-y-2`}>
            <FileUploadComponent setCollectionName={setCollectionName} collectionName={collectionName} files={files} setFiles={setFiles} handleSubmitFiles={handleSubmitFiles} loading={loading} />
            <div className={styles.cloud}>
              <div className={styles.messagelist}>
                {messages.map((message, index) => {
                  let icon;
                  let className;
                  if (message.role === 'assistant') {
                    icon = (
                      <Image
                        key={`${index}-api`}
                        src="/bot-image.png"
                        alt="AI"
                        width="40"
                        height="40"
                        className={styles.boticon}
                        priority
                      />
                    );
                    className = styles.apimessage;
                  } else {
                    icon = (
                      <Image
                        key={`${index}-notapi`}
                        src="/usericon.png"
                        alt="Me"
                        width="30"
                        height="30"
                        className={styles.usericon}
                        priority
                      />
                    );
                    // The latest message sent by the user will be animated while waiting for a response
                    className =
                      isLoading && index === messages.length - 1
                        ? styles.usermessagewaiting
                        : styles.usermessage;
                  }
                  return (
                    <>
                      <div key={`chatMessage-${index}`} className={className}>
                        {icon}
                        <div className={styles.markdownanswer} ref={messageListRef}>
                          <ReactMarkdown linkTarget="_blank">
                            {message.content}
                          </ReactMarkdown>
                        </div>
                      </div>
                      {sourcesForMessages[index + 1] && (
                        <div
                          className="p-5"
                          key={`sourceDocsAccordion-${index}`}
                        >
                          <Accordion
                            type="single"
                            collapsible
                            className="flex-col"
                          >
                            {sourcesForMessages[index + 1].map((doc: Document, index: number) => (
                              <div key={`messageSourceDocs-${index}`} >
                                <AccordionItem value={`item-${index}`}>
                                  <AccordionTrigger>
                                    <h3>Source {index + 1}</h3>
                                  </AccordionTrigger>
                                  <AccordionContent>
                                    <ReactMarkdown linkTarget="_blank">
                                      {doc.pageContent}
                                    </ReactMarkdown>
                                    <p className="mt-2">
                                      <b>Source:</b> {doc.metadata.source}
                                    </p>
                                  </AccordionContent>
                                </AccordionItem>
                              </div>
                            ))}
                          </Accordion>
                        </div>
                      )}
                    </>
                  );
                })}
              </div>
            </div>
            <div className={styles.center}>
              <div className={styles.cloudform}>
                <form onSubmit={handleSubmit}>
                  <textarea
                    disabled={isLoading}
                    onKeyDown={handleEnter}
                    ref={textAreaRef}
                    autoFocus={false}
                    rows={1}
                    maxLength={512}
                    placeholder={
                      isLoading
                        ? 'Waiting for response...'
                        : 'What is this document about?'
                    }
                    value={input}
                    onChange={handleInputChange}
                    className={styles.textarea}
                  />
                  <button
                    type="submit"
                    disabled={isLoading}
                    className={styles.generatebutton}
                  >
                    {isLoading ? (
                      <div className={styles.loadingwheel}>
                        <LoadingDots color="#000" />
                      </div>
                    ) : (
                      // Send icon SVG in input field
                      <svg
                        viewBox="0 0 20 20"
                        className={styles.svgicon}
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z"></path>
                      </svg>
                    )}
                  </button>
                </form>
              </div>
            </div>
            {(error || fileError) && (
              <div className="border border-red-400 rounded-md p-4">
                <p className="text-red-500">{(error ?? fileError)?.name}</p>
                <p className="text-red-500">{(error ?? fileError)?.message}</p>
                <p className="text-red-500">{(error ?? fileError)?.cause as ReactNode}</p>
              </div>
            )}
          </main>
        </div>
        <footer className="m-auto p-4">
          <a href="https://twitter.com/vikashloomba">
            Powered by LangChainAI and Chroma. Demo built by Vikash Loomba (Twitter:
            @vikashloomba).
          </a>
        </footer>
      </Layout>
    </>
  );
}
