import React, { useState } from 'react';
import { fileOpen } from 'browser-fs-access';
import type { FileWithHandle } from 'browser-fs-access'

function FileUploadComponent(props: { setCollectionName: (collectionName: string | null) => void, collectionName: string | null, files: FileWithHandle[], setFiles: (files: FileWithHandle[]) => void, handleSubmitFiles: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState<boolean>(false);

  const handleFileOpen = async () => {
    try {
      const addedFiles = await fileOpen({
        mimeTypes: ['application/pdf'],
        extensions: ['.pdf'],
        multiple: true,
      });
      // Handle the uploaded files here
      console.log(addedFiles);
      props.setFiles([...addedFiles, ...props.files])
    } catch (error) {
      console.error('Error opening files:', error);
    }
  };

  const handleDragOver = (event: { preventDefault: () => void; stopPropagation: () => void; }) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (event: { preventDefault: () => void; stopPropagation: () => void; }) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (event: { preventDefault: () => void; stopPropagation: () => void; dataTransfer: { files: any; }; }) => {
    event.preventDefault();
    event.stopPropagation();
    setIsDragging(false);

    const droppedFiles = event.dataTransfer.files;
    if (droppedFiles?.length > 0) {
      // Handle the dropped files here
      console.log(droppedFiles);
      props.setFiles([...droppedFiles, ...props.files])
    }
  };

  

  const resetFileState = () => {
    props.setCollectionName(null);
    props.setFiles([]);

  }

  return (
    <div className="flex flex-col min-w-64 items-center justify-center bg-grey-lighter">
      <label
        className={`min-w-full flex flex-col items-center px-4 py-6 bg-white text-blue-500 rounded-lg shadow-lg tracking-wide uppercase border border-blue-500 cursor-pointer hover:bg-blue-500 hover:text-white hover:shadow-none ${isDragging ? 'hover:shadow-none hover:-translate-y-1' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleFileOpen}
      >
        <>
            <svg className="w-8 h-8" fill="currentColor" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M16.88 9.1A4 4 0 0 1 16 17H5a5 5 0 0 1-1-9.9V7a3 3 0 0 1 4.52-2.59A4.98 4.98 0 0 1 17 8c0 .38-.04.74-.12 1.1zM11 11h3l-4-4-4 4h3v3h2v-3z" />
            </svg>
            <span className="mt-2 text-base leading-normal">Select a file</span>
          </>
      </label>
      <>
      {props.files?.length > 0 && <ul>
            {props.files.map((file, index) => (
              <li key={index} className="text-sm py-1">{file.name}</li>
            ))}
          </ul>}
      </>
      {props.files?.length > 0 && (
        <><button
          type='button'
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700 focus:outline-none"
          onClick={props.handleSubmitFiles}
          disabled={loading}
        >
          {loading ? <>
            <svg aria-hidden="true" role="status" className="inline mr-3 w-4 h-4 text-white animate-spin" viewBox="0 0 100 101" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="#E5E7EB"></path>
              <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentColor"></path>
            </svg>
            Loading...
          </> : 'Upload'}
        </button>
        <button
          type='button'
          className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 active:bg-blue-700 focus:outline-none"
          onClick={resetFileState}
          disabled={loading}
        >Clear Documents
        </button></>
      )}
    </div>
  );
}

export default FileUploadComponent;
