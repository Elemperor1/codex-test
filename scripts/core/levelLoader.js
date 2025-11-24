import { logger } from './logger.js';

export async function loadLevel(path) {
  try {
    const response = await fetch(path);
    if (!response.ok) {
      const error = new Error(`Unable to load level from ${path}`);
      error.responseStatus = response.status;
      error.responseStatusText = response.statusText;
      throw error;
    }
    return response.json();
  } catch (error) {
    logger.error('Level data could not be retrieved or parsed.', {
      path,
      status: error.responseStatus,
      statusText: error.responseStatusText,
      error,
      nextSteps: 'Check your internet connection, confirm the level file exists, then reload the page to try again.'
    });
    throw error;
  }
}
