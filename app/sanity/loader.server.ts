import { loadQuery, setServerClient } from '@sanity/react-loader';
import { client } from './client';

const serverClient = client.withConfig({
  token: import.meta.env.SANITY_VIEWER_TOKEN || process.env.SANITY_API_READ_TOKEN || process.env.SANITY_VIEWER_TOKEN
});

setServerClient(serverClient);

export { loadQuery };
