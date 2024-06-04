from flask import Flask, request, jsonify
import loadlib
import utils
import pandas as pd
from langchain.llms import Ollama
from langchain.vectorstores import Chroma
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from langchain.callbacks.manager import CallbackManager
from langchain.callbacks.streaming_stdout import StreamingStdOutCallbackHandler
from langchain.embeddings import HuggingFaceEmbeddings

app = Flask(__name__)

# Global variables to hold the model and vectordb
chain = None

def process_movies_to_documents():
    #df = pd.read_csv('./data/titles.csv')
    documents = []
    subject = 'Film'
    lang = 'en'
    docs = loadlib.loadWiki(subject, lang, 2)
    documents.extend(docs)
    #titles_to_process = df['originalTitle']
    #for title in titles_to_process:
    #    docs = loadlib.loadWiki(title, lang, 2)
    #    documents.extend(docs)
    return documents

def create_embeddings(documents):
    splits = utils.chunkDocs(documents, 350)
    model_name = "sentence-transformers/all-mpnet-base-v2"
    model_kwargs = {'device': 'cpu'}
    encode_kwargs = {'normalize_embeddings': False}

    embeddings = HuggingFaceEmbeddings(
        model_name=model_name,
        model_kwargs=model_kwargs,
        encode_kwargs=encode_kwargs
    )

    persist_directory = './data/chroma/'

    vectordb = Chroma.from_documents(
        documents=splits,
        embedding=embeddings,
        persist_directory=persist_directory
    )
    vectordb.persist()
    return vectordb

def create_model(vectordb):
    llm = Ollama(model="mistral", callback_manager=CallbackManager([StreamingStdOutCallbackHandler()]))

    template = """Use the following pieces of context to answer the question at the end. 
    If you don't know the answer, just say that you don't know, don't try to make up an answer. 
    Use five sentences maximum. Keep the answer as concise as possible. 
    Always say "thanks for asking!" at the end of the answer. 

    {context}

    Question: {question}

    Helpful Answer:
    """

    prompt = PromptTemplate.from_template(template)
    chain = RetrievalQA.from_chain_type(
        llm,
        retriever=vectordb.as_retriever(),
        return_source_documents=True,
        chain_type_kwargs={"prompt": prompt}
    )
    return chain

def initialize():
    global chain
    print("Started initializing model")
    documents = process_movies_to_documents()
    vectordb = create_embeddings(documents)
    chain = create_model(vectordb)
    print("Model initialized")

@app.route('/chatbot', methods=['POST'])
def ask():
    global chain
    question = request.json.get('question')
    result = chain({"query": question})
    return jsonify(result["result"])

if __name__ == '__main__':
    initialize()
    app.run(port=5003, debug=True)