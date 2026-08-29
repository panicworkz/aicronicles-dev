import { getPayload } from 'payload';
import config from '../src/payload.config';

function stripHtml(html: string) {
  return html.replace(/<[^>]*>?/gm, '').trim();
}

function htmlToLexical(html: string) {
  if (!html) {
    return {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        children: [
          {
            type: 'paragraph',
            format: '',
            indent: 0,
            version: 1,
            children: [{ type: 'text', text: '', format: 0, version: 1 }],
          },
        ],
      },
    };
  }

  const children: any[] = [];
  
  // Split HTML by block elements: p, h1, h2, h3, h4, h5, h6, blockquote, ul, ol, li
  const blockRegex = /<(h[1-6]|p|blockquote|ul|ol|li)[^>]*>([\s\S]*?)<\/\1>/gi;
  let match;
  let hasMatches = false;

  while ((match = blockRegex.exec(html)) !== null) {
    hasMatches = true;
    const tag = match[1].toLowerCase();
    const innerHtml = match[2];
    const plainText = stripHtml(innerHtml);

    if (!plainText) continue;

    if (tag.startsWith('h')) {
      children.push({
        type: 'heading',
        tag: tag,
        format: '',
        indent: 0,
        version: 1,
        children: [{ type: 'text', text: plainText, format: 0, version: 1 }],
      });
    } else if (tag === 'blockquote') {
      children.push({
        type: 'quote',
        format: '',
        indent: 0,
        version: 1,
        children: [{ type: 'text', text: plainText, format: 0, version: 1 }],
      });
    } else if (tag === 'li') {
      children.push({
        type: 'listitem',
        format: '',
        indent: 0,
        version: 1,
        value: 1,
        children: [{ type: 'text', text: plainText, format: 0, version: 1 }],
      });
    } else {
      children.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{ type: 'text', text: plainText, format: 0, version: 1 }],
      });
    }
  }

  if (!hasMatches || children.length === 0) {
    const rawText = stripHtml(html);
    const paragraphs = rawText.split('\n\n').filter(p => p.trim());
    for (const p of paragraphs) {
      children.push({
        type: 'paragraph',
        format: '',
        indent: 0,
        version: 1,
        children: [{ type: 'text', text: p.trim(), format: 0, version: 1 }],
      });
    }
  }

  return {
    root: {
      type: 'root',
      format: '',
      indent: 0,
      version: 1,
      children: children.length > 0 ? children : [
        {
          type: 'paragraph',
          format: '',
          indent: 0,
          version: 1,
          children: [{ type: 'text', text: '', format: 0, version: 1 }],
        },
      ],
    },
  };
}

async function run() {
  const payload = await getPayload({ config });
  
  console.log('--- Converting Posts to Lexical ---');
  const posts = await payload.find({ collection: 'posts', limit: 100 });
  for (const post of posts.docs) {
    if (post.contentHtml) {
      const lexicalData = htmlToLexical(post.contentHtml);
      await payload.update({
        collection: 'posts',
        id: post.id,
        data: {
          content: lexicalData as any,
        },
      });
      console.log(`✓ Converted post: ${post.title}`);
    }
  }

  console.log('--- Converting Pages to Lexical ---');
  const pages = await payload.find({ collection: 'pages', limit: 100 });
  for (const page of pages.docs) {
    if (page.contentHtml) {
      const lexicalData = htmlToLexical(page.contentHtml);
      await payload.update({
        collection: 'pages',
        id: page.id,
        data: {
          content: lexicalData as any,
        },
      });
      console.log(`✓ Converted page: ${page.title}`);
    }
  }

  console.log('🎉 ALL CONTENT CONVERTED TO LEXICAL!');
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
