export function parseRuby(src: string): { rb: string, rt: string } {
  const matched = src.match(/<ruby>([^<]+)<rt>([^<]+)(?:<\/rt>)*<\/ruby>/);

  if (matched) {
    const [, rb, rt] = matched;
    return { rb, rt };
  } else {
    return { rb: '⚠', rt: '⚠' };
  }
}

export const rubyRule = /(<ruby>.*?<\/ruby>)/