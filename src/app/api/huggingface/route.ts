// src/app/api/huggingface/route.ts - Remains largely the same
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { prompt, model, maxTokens, temperature } = await request.json();
    
    const response = await fetch(`https://api-inference.huggingface.co/models/${model || 'cutycat2000x/MeowGPT-3.5'}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.HUGGINGFACE_API_KEY}`
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: maxTokens || 200,
          temperature: temperature || 0.3,
          return_full_text: false
        }
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      return NextResponse.json(
        { error: error.error || `Hugging Face API error: ${response.status}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    
    // Standardize response format
    let output = '';
    if (Array.isArray(result) && result.length > 0) {
      output = result[0].generated_text || result[0].summary_text || result[0];
    } else if (typeof result === 'string') {
      output = result;
    } else if (result.generated_text) {
      output = result.generated_text;
    }
    
    return NextResponse.json({ result: output.trim() });
  } catch (error) {
    console.error('Hugging Face API proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    );
  }
}