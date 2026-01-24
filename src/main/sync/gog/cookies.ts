import { session } from 'electron';

export async function getGogAccessToken(): Promise<string> {
  const cookies = await session.defaultSession.cookies.get({
    domain: '.gog.com',
  });

  const gogAl = cookies.find(c => c.name === 'gog-al');

  if (!gogAl) {
    throw new Error('GOG not logged in (gog-al cookie missing)');
  }

  return gogAl.value;
}

export async function waitForGogEmbedAuth() {
  for (let i = 0; i < 20; i++) {
    const cookies = await session.defaultSession.cookies.get({
      domain: '.gog.com',
    });

    const hasEmbedAuth =
      cookies.some(c => c.name === 'gog-al') &&
      cookies.some(c => c.domain.includes('embed.gog.com'));

    if (hasEmbedAuth) return true;

    await new Promise(r => setTimeout(r, 500));
  }

  throw new Error('GOG embed authentication not completed');
}

