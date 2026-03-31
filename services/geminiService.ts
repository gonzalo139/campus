
import { GoogleGenAI } from "@google/genai";

// Initialize the GoogleGenAI client using the environment variable exclusively.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const getTeacherInsights = async (data: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analiza los siguientes datos de rendimiento escolar y proporciona 3 alertas clave en ESPAÑOL para el panel docente (alumnos en riesgo, conflictos de equipo, patrones de calificación inusuales): ${JSON.stringify(data)}`,
      config: {
        responseMimeType: "application/json"
      }
    });
    return response.text ? JSON.parse(response.text) : null;
  } catch (error) {
    console.error("Gemini Insight Error:", error);
    return null;
  }
};

export const auditConflict = async (evaluationA: any, evaluationB: any) => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `Hay una desviación significativa entre dos evaluadores pares para el mismo proyecto.
      Evaluador A dio: ${JSON.stringify(evaluationA)}.
      Evaluador B dio: ${JSON.stringify(evaluationB)}.
      Determina en ESPAÑOL si hay evidencia de 'amiguismo' o si la desviación está justificada. Proporciona un veredicto corto para el profesor.`,
    });
    return response.text;
  } catch (error) {
    console.error("Conflict Audit Error:", error);
    return "Error al realizar la auditoría automática.";
  }
};
