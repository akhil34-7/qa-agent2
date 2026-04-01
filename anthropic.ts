export async function runQAAgentStream(
  apiKey: string,
  featureDescription: string,
  systemPrompt: string,
  onChunk: (chunk: string) => void,
  onError: (error: string) => void,
  onComplete: () => void
) {
  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'anthropic-dangerous-direct-browser-access': 'true',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 8000,
        stream: true,
        system: systemPrompt,
        messages: [{ role: 'user', content: featureDescription }]
      })
    });

    if (response.status === 401) {
      throw new Error('Invalid API key — check your key and try again');
    }
    if (response.status === 429) {
      throw new Error('Rate limited — wait a moment and retry');
    }
    if (!response.ok) {
      const err = await response.text();
      throw new Error(`API Error: ${response.status} ${err}`);
    }

    if (!response.body) throw new Error('No response body');

    const reader = response.body.getReader();
    const decoder = new TextDecoder('utf-8');
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.trim() === '') continue;
        if (line.startsWith('data: ') && line !== 'data: [DONE]') {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta && data.delta.type === 'text_delta') {
              onChunk(data.delta.text);
            }
          } catch(e) {
            // ignore JSON parse errors for incomplete chunks
          }
        }
      }
    }
    onComplete();
  } catch (error: any) {
    onError(error.message);
  }
}
