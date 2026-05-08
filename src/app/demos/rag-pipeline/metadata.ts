import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'RAG Pipeline — Browser-Native AI with Vector Embeddings | Prasad Kavuri',
  description:
    'Production RAG pattern running entirely in-browser: real vector embeddings via Transformers.js, cosine similarity retrieval, and document ranking — no API key required. Demonstrates AI platform engineering depth.',
  alternates: {
    canonical: 'https://www.prasadkavuri.com/demos/rag-pipeline',
  },
  openGraph: {
    title: 'RAG Pipeline — Browser-Native Vector Embeddings | Prasad Kavuri',
    description:
      'Real retrieval-augmented generation with Transformers.js WASM embeddings running fully in-browser. No server, no API key — pure client-side AI.',
    url: 'https://www.prasadkavuri.com/demos/rag-pipeline',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RAG Pipeline — Browser-Native Vector Embeddings',
    description:
      'Real RAG with WASM embeddings in the browser — no API key needed. Production AI pattern demo by VP of AI Engineering Prasad Kavuri.',
  },
};
