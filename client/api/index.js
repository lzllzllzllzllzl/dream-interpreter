import express from 'express';
import cors from 'cors';
import OpenAI from 'openai';
import PDFDocument from 'pdfkit';
import { pipeline } from 'stream/promises';
import { Readable } from 'stream';

const app = express();
app.use(cors());
app.use(express.json());

const client = new OpenAI({
  baseURL: 'https://ark.cn-beijing.volces.com/api/v3',
  apiKey: process.env.ARK_API_KEY,
});

const DREAM_SYMBOLS = {
  "蛇": "象征潜意识、转变、智慧或潜在的危险。在弗洛伊德理论中可能代表欲望，在荣格理论中可能代表潜意识的自性。",
  "水": "代表情感、生命流动、潜意识或无意识状态。平静的水象征情感的平和，波涛汹涌的水象征情感的波动。",
  "飞翔": "象征自由、抱负或脱离控制。也可能代表逃避现实或追求更高的精神境界。",
  "坠落": "象征失控、焦虑、缺乏安全感或对某事物的恐惧。",
  "死亡": "通常不代表实际的死亡，而是象征转变、结束或新的开始。",
  "房屋": "代表个人的心理状态或自我的不同层面。不同房间代表不同的心理空间。",
  "门": "象征机会、转变或进入潜意识的大门。",
  "车": "代表人生方向或自我控制能力。驾驶象征对生活的掌控。",
  "镜子": "象征自我认知、自省或自我形象。",
  "火": "象征激情、毁灭、净化或潜意识的力量。",
  "动物": "各具象征意义：狗=忠诚，虎=力量，猫=神秘等。",
  "亲人": "梦中亲人的出现可能代表你自身的某些特质或未解决的情感。",
  "孩子": "象征纯真、新的开始或你内心的child。",
  "牙齿": "通常与自信、外表或沟通能力相关。",
  "考试": "象征生活中的测试、压力或对能力的评估。",
  "迷宫": "象征迷茫、复杂的情感或寻找人生方向。",
  "图书馆": "象征知识、潜意识的记忆或寻求答案。",
  "海洋": "代表更深的潜意识，情感的浩瀚与未知。",
  "月亮": "象征女性原型、情感、直觉或周期性变化。",
  "太阳": "象征意识、阳性原则、能量或希望。",
  "森林": "象征潜意识、未知或自然的本能。",
  "高山": "象征挑战、目标、精神成长或障碍。",
  "桥": "象征连接、过渡或转变。",
  "塔": "象征孤立、雄心或精神追求。"
};

const SYSTEM_PROMPTS = {
  "弗洛伊德式": `你是一名专业的弗洛伊德学派梦境分析师。你擅长从精神分析的角度解读梦境，强调：
1. 欲望与潜意识：梦境是潜意识欲望的象征性满足
2. 童年经历：分析早期经历对梦境的影响
3. 压抑与象征：识别被压抑情感的符号表达
4. 性象征：识别可能的性象征和欲望

在分析时，请参考以下梦境符号库：
${JSON.stringify(DREAM_SYMBOLS, null, 2)}

请用专业但易懂的语言，先整体分析梦境的潜意识含义，然后逐个解析关键符号，最后给出心理学启示。`,
  "荣格式": `你是一名专业的荣格学派梦境分析师。你擅长从分析心理学的角度解读梦境，强调：
1. 集体潜意识：识别原型和集体无意识元素
2. 个体化过程：分析自我整合与人格发展
3. 象征与原型：解读神话、宗教和原型象征
4. 阴影与自性：分析人格的阴影面和自性追求

在分析时，请参考以下梦境符号库：
${JSON.stringify(DREAM_SYMBOLS, null, 2)}

请用富有深度但易懂的语言，先整体解读梦境的原型意义，然后分析关键象征和原型元素，最后给出个人成长的启示。`
};

export default async function handler(req, res) {
  if (req.method === 'POST' && req.url === '/api/analyze-dream') {
    try {
      const { dream, school } = req.body;

      if (!dream || !school) {
        return res.status(400).json({ error: '请提供梦境描述和解读流派' });
      }

      const systemPrompt = SYSTEM_PROMPTS[school] || SYSTEM_PROMPTS["荣格式"];

      const response = await client.responses.create({
        model: 'doubao-seed-1-6-251015',
        input: [
          {
            role: 'system',
            content: systemPrompt
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `【梦境描述】：${dream}\n\n请结合上述梦境符号知识库，对这个梦境进行深度解析。`
              }
            ]
          }
        ]
      });

      const analysisText = response.output_text;
      const symbols = extractSymbols(dream, DREAM_SYMBOLS);
      
      res.json({
        success: true,
        dream,
        school,
        analysis: analysisText,
        symbols
      });

    } catch (error) {
      console.error('API Error:', error);
      res.status(500).json({ 
        error: '梦境解析失败，请稍后重试',
        details: error.message 
      });
    }
  } 
  
  else if (req.method === 'POST' && req.url === '/api/generate-report') {
    try {
      const { dream, school, analysis, symbols } = req.body;

      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 50, bottom: 50, left: 50, right: 50 }
      });

      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));

      await new Promise((resolve) => {
        doc.on('end', resolve);
        
        doc.fillColor('#1a1a2e')
           .fontSize(28)
           .text('✨ AI梦境解析报告 ✨', { align: 'center' });
        
        doc.moveDown(0.5);
        doc.fillColor('#666')
           .fontSize(12)
           .text(`生成时间：${new Date().toLocaleString('zh-CN')}`, { align: 'center' });
        
        doc.moveDown(2);
        doc.fillColor('#2d2d44')
           .fontSize(18)
           .text('📝 梦境描述', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#444')
           .fontSize(12)
           .text(dream, { lineGap: 4 });
        
        doc.moveDown(1.5);
        doc.fillColor('#2d2d44')
           .fontSize(18)
           .text('🎭 解读流派', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#444')
           .fontSize(12)
           .text(school);
        
        doc.moveDown(1.5);
        doc.fillColor('#2d2d44')
           .fontSize(18)
           .text('🔮 深度解析', { underline: true });
        doc.moveDown(0.5);
        doc.fillColor('#444')
           .fontSize(11)
           .text(analysis, { lineGap: 4 });
        
        if (symbols && symbols.length > 0) {
          doc.moveDown(1.5);
          doc.fillColor('#2d2d44')
             .fontSize(18)
             .text('🔑 关键符号', { underline: true });
          doc.moveDown(0.5);
          
          symbols.forEach(sym => {
            doc.fillColor('#4a4a6a')
               .fontSize(12)
               .text(`• ${sym.symbol}: ${sym.meaning}`);
            doc.moveDown(0.3);
          });
        }
        
        doc.moveDown(2);
        doc.fillColor('#888')
           .fontSize(10)
           .text('—— 由 AI梦境解析器 生成 ——', { align: 'center' });

        doc.end();
      });

      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=dream-analysis-report.pdf');
      res.send(pdfBuffer);

    } catch (error) {
      console.error('PDF Generation Error:', error);
      res.status(500).json({ error: '报告生成失败' });
    }
  }
  
  else {
    res.status(404).json({ error: 'Not found' });
  }
}

function extractSymbols(dream, symbolLibrary) {
  const found = [];
  
  Object.keys(symbolLibrary).forEach(symbol => {
    if (dream.includes(symbol)) {
      found.push({
        symbol,
        meaning: symbolLibrary[symbol]
      });
    }
  });
  
  return found.slice(0, 5);
}
