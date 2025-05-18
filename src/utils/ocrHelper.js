// src/utils/ocrHelper.js
import { createWorker } from 'tesseract.js';

export const extractTextFromImage = async (imageDataUrl, lang = 'por') => {
  const worker = await createWorker({
    logger: m => console.log(m), // você pode remover isso se não quiser logs
  });

  try {
    await worker.loadLanguage(lang);
    await worker.initialize(lang);

    const {
      data: { text },
    } = await worker.recognize(imageDataUrl);

    await worker.terminate();
    return text;
  } catch (error) {
    await worker.terminate();
    throw error;
  }
};
