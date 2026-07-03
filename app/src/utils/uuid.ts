/**
 * Gera um UUID v4. Usado para agrupar despesas recorrentes (recurrent_id).
 * Não é de uso criptográfico, então Math.random é suficiente e evita depender
 * de crypto.getRandomValues (nem sempre disponível no Hermes).
 */
export function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
