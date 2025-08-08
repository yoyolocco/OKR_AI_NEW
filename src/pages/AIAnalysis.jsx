
import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, MessageCircle, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

const AIAnalysis = () => {
  const [query, setQuery] = useState('');
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'ai',
      content: 'Merhaba! Mevcut OKR verilerinizi sorgulayarak anında içgörüler edinin.',
      timestamp: new Date()
    }
  ]);
  const { toast } = useToast();

  const handleSendQuery = async () => {
    if (!query.trim()) return;

    // Add user message
    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: query,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setQuery(''); // Clear input immediately

    try {
      const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
      console.log("Gemini API Key (from .env):", geminiApiKey ? "Yüklendi" : "Yüklenmedi"); // Hata ayıklama için eklendi
      if (!geminiApiKey) {
        toast({
          variant: "destructive",
          title: "API Anahtarı Eksik",
          description: "Lütfen .env dosyanıza VITE_GEMINI_API_KEY değerini ekleyin.",
        });
        return;
      }

      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${geminiApiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            { role: "user", parts: [{ text: query }] }
          ],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error.message || 'Gemini API hatası');
      }

      const data = await response.json();
      const aiResponseContent = data.candidates[0].content.parts[0].text;

      const aiResponse = {
        id: Date.now() + 1,
        type: 'ai',
        content: aiResponseContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, aiResponse]);

    } catch (error) {
      console.error("AI API Hatası:", error);
      toast({
        variant: "destructive",
        title: "AI Analiz Hatası",
        description: error.message || "Yapay zeka yanıtı alınamadı.",
      });
    }
  };

  const exampleQueries = [
    "Hangi departmanın hedefleri daha riskli?",
    "Hangi departmanlar hız ile ilgili KR almış?",
    "En düşük performanslı hedefler hangileri?",
    "Çeyrek sonu tahminleri nasıl?"
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-3"
      >
        <Brain className="w-8 h-8 text-brand-cyan" />
        <h1 className="text-3xl font-bold text-white">AI Destekli Analiz</h1>
      </motion.div>

      <motion.p
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="text-gray-400"
      >
        Mevcut OKR verilerinizi sorgulayarak anında içgörüler edinin.
      </motion.p>

      {/* Chat Interface */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glassmorphism rounded-xl p-6"
      >
        <div className="flex items-center space-x-3 mb-6">
          <MessageCircle className="w-6 h-6 text-brand-cyan" />
          <h2 className="text-xl font-bold text-white">Analiz Sorgusu</h2>
        </div>

        {/* Messages */}
        <div className="space-y-4 mb-6 max-h-96 overflow-y-auto scrollbar-thin">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={message.type === 'ai' ? 'ai-chat-bubble' : 'user-chat-bubble ml-auto max-w-xs'}
            >
              <p className="text-white">{message.content}</p>
            </motion.div>
          ))}
        </div>

        {/* Input */}
        <div className="flex space-x-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Sorgunuzu buraya yazın..."
            className="flex-1 bg-slate-700 border border-brand-cyan/30 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:border-brand-cyan"
            onKeyPress={(e) => e.key === 'Enter' && handleSendQuery()}
          />
          <Button 
            onClick={handleSendQuery}
            className="bg-brand-cyan hover:bg-brand-cyan/90 text-brand-dark"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>

        {/* Example Queries */}
        <div className="mt-6">
          <p className="text-sm text-gray-400 mb-3">
            Örnek: "Hangi departmanın hedefleri daha riskli?", "hangi departmanlar hız ile ilgili kr almış"
          </p>
          
          <div className="flex flex-wrap gap-2">
            {exampleQueries.map((example, index) => (
              <button
                key={index}
                onClick={() => setQuery(example)}
                className="text-xs bg-slate-700 hover:bg-slate-600 text-brand-cyan px-3 py-2 rounded-lg transition-colors"
              >
                {example}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Analysis Results Placeholder */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glassmorphism rounded-xl p-6"
      >
        <h2 className="text-xl font-bold text-white mb-4">Analiz Sonuçları</h2>
        
        <div className="bg-slate-800/50 rounded-lg p-6 text-center">
          <Brain className="w-12 h-12 text-brand-cyan mx-auto mb-4" />
          <p className="text-gray-300 mb-2">Henüz analiz yapılmadı</p>
          <p className="text-gray-400 text-sm">
            Yukarıdaki chat alanından bir soru sorarak AI destekli analiz başlatabilirsiniz.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default AIAnalysis;
