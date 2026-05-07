export type ChatMessage = { role: 'user' | 'assistant'; content: string };

let messages = $state<ChatMessage[]>([]);
let loading  = $state(false);
let error    = $state<string | null>(null);
let open     = $state(false);
let input    = $state('');

export const getMessages = () => messages;
export const isLoading   = () => loading;
export const getError    = () => error;
export const isOpen      = () => open;
export const getInput    = () => input;
export const setInput    = (v: string) => { input = v; };
export const toggleOpen  = () => { open = !open; };
export const closePanel  = () => { open = false; };
export const clearHistory = () => { messages = []; error = null; };

export async function sendMessage(model: string) {
  if (!input.trim() || loading) return;

  messages.push({ role: 'user', content: input.trim() });
  input = '';
  error = null;
  loading = true;

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ model, messages })
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      error = (data as { message?: string }).message ?? 'Something went wrong. Try again.';
      return;
    }

    const reply = (data as { message: ChatMessage }).message;
    messages.push({ role: 'assistant', content: reply.content });
  } catch {
    error = 'Network error. Check your connection.';
  } finally {
    loading = false;
  }
}
