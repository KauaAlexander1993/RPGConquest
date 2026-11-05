function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export async function readApiResponse<T>(response: Response): Promise<T> {
  const body = await response.text();
  let payload: unknown;

  if (!body.trim()) {
    throw new Error(`O servidor enviou uma resposta vazia (HTTP ${response.status}). Verifique se o jogo está ativo e tente novamente.`);
  }

  try {
    payload = JSON.parse(body);
  } catch {
    throw new Error(`O servidor enviou uma resposta incompleta ou inválida (HTTP ${response.status}). Tente novamente; se o erro continuar, reinicie o servidor.`);
  }

  if (!response.ok) {
    const message = isRecord(payload) && typeof payload.error === 'string'
      ? payload.error
      : `O servidor não conseguiu concluir a solicitação (HTTP ${response.status}).`;
    throw new Error(message);
  }

  return payload as T;
}
