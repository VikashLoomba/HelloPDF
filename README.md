# HelloPDF - Deployable GPT-4 Powered PDF Chat

Run and deploy a GPT-4 powered chatbot in minutes!

Utilizes ChromaDB for its vectorstore, with a Next.js frontend.

## Development

1. Install [Docker Desktop](https://www.docker.com/products/docker-desktop/) for your platform.

2. Clone the repo or download the ZIP

```
git clone [github https url]
```

3. Install packages

First run `npm install yarn -g` to install yarn globally (if you haven't already).

Then run:

```
yarn install
```

After installation, you should now see a `node_modules` folder.

4. Set up your `.env` file

- Copy `.env.example` into `.env`
  Your `.env` file should look like this:

```
OPENAI_API_KEY=
CHROMA_AUTH_BASIC=
CHROMA_AUTH_TOKEN=
CHROMA_URL=
COLLECTION_NAME=[optional]

```

- Visit [openai](https://help.openai.com/en/articles/4936850-where-do-i-find-my-secret-api-key) to retrieve API keys and insert into your `.env` file.
- Choose a collection name where you'd like to store your embeddings in Chroma. This collection will later be used for queries and retrieval.
- [Chroma details](https://docs.trychroma.com/getting-started)

5. Depending on your setup, you may need to modify `app/api/files/utilities.ts` to connect to the right ChromaDB instance.

6. In a new terminal window, run Chroma in the Docker container:

```
docker run -p 8000:8000 ghcr.io/chroma-core/chroma:latest
```

## Run the app

You can run the app with `npm run dev` to launch the local dev environment, and then upload one or many PDF files to chat with. After uploading, you'll be able to chat with the model.

## ChromaDB Deployment

The terraform folder contains scripts originally from `chromadb/examples`. To deploy your ChromaDB to GCP, do as follows:

1. Install GCP CLI, log in via CLI, and create a new project. Note the project ID.

2. Install terraform CLI.

3. Update `terraform/exportapply.sh` with your project ID variable.

4. (Optional) Generate a keypair if you want to be able to SSH in to the GCP instance.

5. Run `exportapply.sh` in your terminal. 

6. Run `terraform output instance_public_ip`. Take note of the output IP, and update your `.env`.

7. Run `terraform output chroma_auth_token`. Take note of your auth token, and update your `.env`.

8. (optional) It takes some time for the GCP instance to come up, so you can check on the status with 
```
% export instance_public_ip=$(terraform output instance_public_ip | sed 's/"//g')
% curl -v http://$instance_public_ip:8000/api/v1/heartbeat
```

## Troubleshooting

In general, keep an eye out in the `issues` and `discussions` section of this repo for solutions.

**General errors**

- Make sure you're running the latest Node version. Run `node -v`
- Try a different PDF or convert your PDF to text first. It's possible your PDF is corrupted, scanned, or requires OCR to convert to text.
- `Console.log` the `env` variables and make sure they are exposed.
- Check that you've created an `.env` file that contains your valid (and working) API keys, environment and index name.
- If you change `modelName` in `OpenAI`, make sure you have access to the api for the appropriate model.
- Make sure you have enough OpenAI credits and a valid card on your billings account.
- Check that you don't have multiple OPENAPI keys in your global environment. If you do, the local `env` file from the project will be overwritten by systems `env` variable.
- Try to hard code your API keys into the `process.env` variables if there are still issues.

## Credits
Originally forked from https://github.com/mayooear/gpt4-pdf-chatbot-langchain/tree/feat/chroma