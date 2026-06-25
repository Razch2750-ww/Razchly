import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import cors from "cors";
import TradingView from "@mathieuc/tradingview";

process.on('uncaughtException', (err) => {
  console.error("Uncaught Exception:", err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(cors());
  app.use(express.json({ limit: '200mb' }));
  app.use(express.urlencoded({ limit: '200mb', extended: true }));

  // API Route for quotes
  app.get("/api/quotes", async (req, res) => {
    try {
      const symbols = req.query.symbols; // comma separated symbols
      if (!symbols) return res.json({});
      const symArray = typeof symbols === 'string' ? symbols.split(',') : [];

      if (symArray.length === 0) return res.json({});

      const client = new TradingView.Client();
      const session = new client.Session.Quote({ fields: 'all' });
      const results: any[] = [];
      
      const getQuote = (symbol: string) => {
        return new Promise((resolve) => {
          try {
             let parsedSymbol = symbol;
             if (!symbol.includes(':')) {
                 if (symbol.includes('USDT') || symbol.includes('BTC') || symbol.includes('ETH')) {
                     parsedSymbol = `BINANCE:${symbol}`;
                 } else if (symbol === 'EMAS') {
                     parsedSymbol = `ICE:XAUIDRG`;
                 } else if (symbol === 'USDIDR') {
                     parsedSymbol = `FX_IDC:USDIDR`;
                 } else {
                     parsedSymbol = `IDX:${symbol}`;
                 }
             }

             const m = new session.Market(parsedSymbol);
             let resultData: any = {};

             m.onData((data: any) => {
                if(data.symbol === parsedSymbol && data.status === 'ok') {
                   resultData = { ...resultData, ...data };
                }
                if (data.description) resultData.description = data.description;
                if (data.logoid) resultData.logoid = data.logoid;
                if (data['currency_code']) resultData.currency_code = data['currency_code'];
                if (data['base_currency_logoid']) resultData.base_currency_logoid = data['base_currency_logoid'];
                if (data['currency_logoid']) resultData.currency_logoid = data['currency_logoid'];

                if(data.lp || data.price || (data.ask && data.bid)) {
                   const resData = {
                       price: data.lp || data.price || (data.ask + data.bid)/2,
                       change: data.ch || 0,
                       description: resultData.description,
                       logoid: resultData.base_currency_logoid || resultData.logoid,
                       currency: resultData.currency_code
                   };
                   resolve({ symbol, ...resData, realSymbol: parsedSymbol, data: resultData });
                }
             });

             m.onError((err: any) => {
                 resolve({ symbol, error: String(err), realSymbol: parsedSymbol });
             });
             
             setTimeout(() => {
                 resolve({ symbol, error: "timeout", realSymbol: parsedSymbol });
             }, 3500);

          } catch (e) {
             resolve({ symbol, error: String(e) });
          }
        });
      };

      const promises = symArray.map(getQuote);
      const responses = await Promise.all(promises);
      client.end();
      
      const responseDict: any = {};
      responses.forEach((r: any) => {
         responseDict[r.symbol] = r;
      });

      res.json(responseDict);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  // API Route for search
  app.get("/api/search", async (req, res) => {
    try {
      const q = req.query.q as string;
      if (!q) return res.json([]);
      const results = await TradingView.searchMarket(q);
      res.json(results);
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: String(err) });
    }
  });

  // API Route for image analysis
  app.post("/api/gemini/analyze", async (req, res) => {
    try {
      const { images, imageParams, prompt, categories } = req.body;
      const { GoogleGenAI, Type, ThinkingLevel } = await import("@google/genai");
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
      
      let responseFormat;
      let finalPrompt = prompt || "Analyze this image and describe it to me.";
      
      if (categories) {
        finalPrompt += `\n\nEkstrak data mutasi/struk menjadi daftar transaksi.
        Kamu harus menentukan tanggal (format ISO string), jumlah nominal, tipe (income, expense, transfer), catatan, dan categoryId yang paling cocok dari daftar kategori yang diberikan pengguna berikut ini:\n\n${JSON.stringify(categories)}`;

        responseFormat = {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              date: { type: Type.STRING, description: "ISO Date string dari transaksi" },
              amount: { type: Type.NUMBER, description: "Nominal transaksi (hanya angka)" },
              type: { type: Type.STRING, description: "income, expense, atau transfer" },
              note: { type: Type.STRING, description: "Catatan transaksi" },
              categoryId: { type: Type.STRING, description: "ID kategori yang cocok dari daftar yang diberikan, jika ada, atau kosongkan." }
            },
            required: ["date", "amount", "type", "note"]
          }
        };
      }

      const inlineDataParts = (images || [imageParams]).filter(Boolean).map((img: any) => ({
        inlineData: { mimeType: img.mimeType, data: img.data }
      }));

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: {
           parts: [
               ...inlineDataParts,
               { text: finalPrompt }
           ]
        },
        config: {
          ...(responseFormat ? {
            responseMimeType: "application/json",
            responseSchema: responseFormat
          } : {})
        }
      });
      res.json({ text: response.text });
    } catch (err: any) {
      console.error("Analyze error:", err);
      res.status(500).json({ error: String(err), message: err.message, stack: err.stack });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
