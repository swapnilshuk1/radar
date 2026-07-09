import { NextRequest } from 'next/server';
import { runScraper } from '@/lib/scraper';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const encoder = new TextEncoder();

  const customReadable = new ReadableStream({
    async start(controller) {
      const sendEvent = (message: string) => {
        const formatted = `data: ${JSON.stringify({ message })}\n\n`;
        controller.enqueue(encoder.encode(formatted));
      };

      sendEvent('Scraper process started...');

      try {
        await runScraper((msg) => {
          sendEvent(msg);
        });
        sendEvent('SUCCESS: Scraping completed successfully!');
      } catch (err: any) {
        sendEvent(`ERROR: Scraper failed. ${err.message}`);
      } finally {
        controller.close();
      }
    },
  });

  return new Response(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  });
}
