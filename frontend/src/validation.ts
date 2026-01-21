export async function validate(input: string): Promise<{ valid: boolean; error?: string }> {
  try {
    const response = await fetch('http://localhost:5170/blocks/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ input }),
    });
    if (!response.ok) {
      throw new Error(`Server responded with status ${response.status} - ${await response.text()}`);
    }
    const data = (await response.json()) as { valid: boolean; error?: string };
    return data;
  } catch (error) {
    console.error('Error during validation:', error);
    return { valid: true, error: (error as Error).message };
  }
}
