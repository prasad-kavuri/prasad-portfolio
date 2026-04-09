'use client';

import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, Send, Trash2, Copy, Check } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  retrievedDocs?: string[];
  tokenCount?: number;
  responseTime?: number;
}

export default function PortfolioAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [useRAG, setUseRAG] = useState(true);
  const [streamingText, setStreamingText] = useState('');
  const [currentRetrievedDocs, setCurrentRetrievedDocs] = useState<
    Array<{ id: string; title: string }>
  >([]);
  const [currentResponseTime, setCurrentResponseTime] = useState(0);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const suggestedQuestions = [
    "What did Prasad build at Krutrim?",
    'Tell me about Ola Maps achievements',
    'What is Prasad\'s experience with agentic AI?',
    'What are Prasad\'s cloud and infrastructure skills?',
    'How large were the teams Prasad led?',
    "What makes Prasad's AI background unique?",
  ];

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingText]);

  const handleSuggestedQuestion = (question: string) => {
    // Add the question to messages and submit immediately
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: question,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingText('');
    setCurrentRetrievedDocs([]);
    setCurrentResponseTime(0);

    const startTime = performance.now();

    // Call API with the question
    (async () => {
      try {
        const response = await fetch('/api/portfolio-assistant', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: [...messages, userMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
            useRAG,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to get response');
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();

        // Parse retrieved docs from header
        const docsHeader = response.headers.get('X-Retrieved-Docs');
        if (docsHeader && useRAG) {
          try {
            const docs = JSON.parse(docsHeader);
            setCurrentRetrievedDocs(
              docs.map((doc: { id: string; title: string }) => ({
                id: doc.id,
                title: doc.title,
              }))
            );
          } catch {
            // Silent fail
          }
        }

        let fullContent = '';

        while (reader) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullContent += chunk;
          setStreamingText(fullContent);
        }

        const endTime = performance.now();
        setCurrentResponseTime(Math.round(endTime - startTime));

        // Remove metadata suffix if present
        const cleanContent = fullContent
          .replace(/\n\n\[Retrieved \d+ documents\]$/, '')
          .trim();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: cleanContent,
          retrievedDocs: currentRetrievedDocs.map(doc => doc.title),
          tokenCount: Math.ceil(cleanContent.length / 4),
          responseTime: Math.round(endTime - startTime),
        };

        setMessages(prev => [...prev, assistantMessage]);
        setStreamingText('');
      } catch (error) {
        console.error('Error:', error);
        setStreamingText('Sorry, I encountered an error. Please try again.');
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: 'Sorry, I encountered an error. Please try again.',
        };
        setMessages(prev => [...prev, assistantMessage]);
      } finally {
        setIsLoading(false);
      }
    })();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setStreamingText('');
    setCurrentRetrievedDocs([]);
    setCurrentResponseTime(0);

    const startTime = performance.now();

    try {
      const response = await fetch('/api/portfolio-assistant', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
          })),
          useRAG,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      // Parse retrieved docs from header
      const docsHeader = response.headers.get('X-Retrieved-Docs');
      if (docsHeader && useRAG) {
        try {
          const docs = JSON.parse(docsHeader);
          setCurrentRetrievedDocs(
            docs.map((doc: { id: string; title: string }) => ({
              id: doc.id,
              title: doc.title,
            }))
          );
        } catch {
          // Silent fail
        }
      }

      let fullContent = '';

      while (reader) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        fullContent += chunk;
        setStreamingText(fullContent);
      }

      const endTime = performance.now();
      setCurrentResponseTime(Math.round(endTime - startTime));

      // Remove metadata suffix if present
      const cleanContent = fullContent
        .replace(/\n\n\[Retrieved \d+ documents\]$/, '')
        .trim();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: cleanContent,
        retrievedDocs: currentRetrievedDocs.map(doc => doc.title),
        tokenCount: Math.ceil(cleanContent.length / 4), // Rough estimate
        responseTime: Math.round(endTime - startTime),
      };

      setMessages(prev => [...prev, assistantMessage]);
      setStreamingText('');
    } catch (error) {
      console.error('Error:', error);
      setStreamingText('Sorry, I encountered an error. Please try again.');
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, assistantMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    setInput('');
    setStreamingText('');
  };

  const handleCopyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const isEmpty = messages.length === 0 && !streamingText;

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-white">
      {/* Header */}
      <div className="border-b border-slate-700 p-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="hover:bg-slate-800 p-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-2xl font-bold">AI Portfolio Assistant</h1>
              <p className="text-sm text-slate-400">
                Ask anything about Prasad's experience — powered by RAG + Llama
                3.1
              </p>
            </div>
          </div>

          {/* RAG Toggle and Clear */}
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={useRAG}
                onChange={e => setUseRAG(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-sm font-medium">RAG Mode</span>
            </label>
            {messages.length > 0 && (
              <button
                onClick={handleClear}
                className="hover:bg-slate-800 p-2 rounded-lg transition-colors"
                title="Clear chat"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-4xl w-full mx-auto">
        <div className="space-y-4">
          {/* Messages */}
          {messages.map(message => (
            <div
              key={message.id}
              className={`flex gap-3 ${
                message.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`max-w-2xl rounded-lg p-4 ${
                  message.role === 'user'
                    ? 'bg-blue-600 rounded-br-none'
                    : 'bg-slate-800 rounded-bl-none'
                }`}
              >
                <p className="text-white whitespace-pre-wrap break-words">
                  {message.content}
                </p>

                {/* Retrieved Docs Chips */}
                {message.retrievedDocs && message.retrievedDocs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-2">
                    {message.retrievedDocs.map((doc, idx) => (
                      <span
                        key={idx}
                        className="inline-block px-2 py-1 bg-slate-600 rounded text-xs text-slate-200"
                      >
                        {doc}
                      </span>
                    ))}
                  </div>
                )}

                {/* Message Stats */}
                {message.responseTime && (
                  <div className="mt-2 text-xs text-slate-400">
                    Response time: {message.responseTime}ms
                    {message.tokenCount && ` • ~${message.tokenCount} tokens`}
                  </div>
                )}
              </div>

              {/* Copy Button */}
              {message.role === 'assistant' && (
                <button
                  onClick={() => handleCopyMessage(message.id, message.content)}
                  className="hover:bg-slate-800 p-2 rounded transition-colors self-start mt-1"
                  title="Copy message"
                >
                  {copiedId === message.id ? (
                    <Check className="w-4 h-4 text-green-500" />
                  ) : (
                    <Copy className="w-4 h-4 text-slate-400" />
                  )}
                </button>
              )}
            </div>
          ))}

          {/* Streaming Text */}
          {streamingText && (
            <div className="flex gap-3 justify-start">
              <div className="max-w-2xl rounded-lg p-4 bg-slate-800 rounded-bl-none">
                <p className="text-white whitespace-pre-wrap break-words">
                  {streamingText}
                </p>

                {/* Retrieved Docs Chips while streaming */}
                {currentRetrievedDocs.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-slate-700 flex flex-wrap gap-2">
                    {currentRetrievedDocs.map(doc => (
                      <span
                        key={doc.id}
                        className="inline-block px-2 py-1 bg-slate-600 rounded text-xs text-slate-200"
                      >
                        {doc.title}
                      </span>
                    ))}
                  </div>
                )}

                {/* Loading Indicator */}
                {isLoading && (
                  <div className="mt-2 flex gap-1">
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-100"></span>
                    <span className="w-2 h-2 bg-slate-400 rounded-full animate-bounce delay-200"></span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div ref={chatEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-slate-700 bg-slate-800">
        {/* Suggested Questions - Always Visible */}
        <div className={`border-b border-slate-700 px-4 transition-all ${isEmpty ? 'py-6' : 'py-3'}`}>
          <div className="max-w-4xl mx-auto">
            {isEmpty && (
              <p className="text-slate-400 text-center mb-3 text-sm">
                Try asking one of these questions:
              </p>
            )}
            <div className="overflow-x-auto">
              <div className="flex gap-2 pb-2">
                {suggestedQuestions.map((q, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSuggestedQuestion(q)}
                    disabled={isLoading}
                    className={`whitespace-nowrap rounded-full transition-colors flex-shrink-0 ${
                      isEmpty
                        ? 'px-4 py-2 bg-slate-700 hover:bg-slate-600 text-slate-200 text-sm'
                        : 'px-3 py-1 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs'
                    } disabled:opacity-50`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Input Form */}
        <div className="p-4">
          <div className="max-w-4xl mx-auto">
            <form onSubmit={handleSubmit} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Ask about Prasad's experience..."
                disabled={isLoading}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-700 border border-slate-600 text-white placeholder-slate-400 focus:outline-none focus:border-blue-500 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isLoading || !input.trim()}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                Send
              </button>
            </form>

            {/* Footer */}
            <div className="mt-3 text-center text-xs text-slate-400">
              <p>Powered by Groq + Llama 3.1 8B</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
