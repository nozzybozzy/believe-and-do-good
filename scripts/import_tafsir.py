#!/usr/bin/env python3
"""
Import the owner's distilled Ibn Kathir notes into content/tafsir/.

Input:  a folder of docs exported from the "Quran Tafsir" Claude Project,
        named like "067 Al-Mulk.txt|md", "002 Al-Baqarah part 1.txt",
        "113-114 Al-Falaq & An-Nas.txt".
Output: content/tafsir/{nnn}-{slug}[-part-N].md with YAML frontmatter.
        The body is kept word for word. Only the H1 title (and the
        "## Part I · ..." line for split surahs) move into frontmatter.

Usage:  python3 scripts/import_tafsir.py path/to/raw [content/tafsir]
Re-running is safe: files are overwritten from the source docs.
"""
import json
import os
import re
import sys

ROMAN = {'I': 1, 'II': 2, 'III': 3, 'IV': 4}


def slugify(s: str) -> str:
    s = s.lower().replace('&', 'and')
    s = re.sub(r"['`’]", '', s)
    s = re.sub(r'[^a-z0-9]+', '-', s)
    return s.strip('-')


def yaml_str(s: str) -> str:
    return json.dumps(s, ensure_ascii=False)  # JSON strings are valid YAML


def parse_name(stem: str):
    m = re.match(r'^(\d{3})(?:-(\d{3}))?\s+(.+?)(?:\s+part\s+(\d+))?$', stem, re.I)
    if not m:
        raise ValueError(f'Unrecognised doc name: {stem}')
    a = int(m[1])
    b = int(m[2]) if m[2] else a
    return list(range(a, b + 1)), m[3].strip(), int(m[4]) if m[4] else None


def convert(path: str):
    stem = os.path.splitext(os.path.basename(path))[0]
    surahs, name, part = parse_name(stem)
    text = open(path, encoding='utf-8').read().replace('\r\n', '\n')
    lines = text.split('\n')

    title = name
    if lines and lines[0].startswith('# '):
        title = lines[0][2:].strip()
        lines = lines[1:]

    part_label = None
    # Split surahs carry "## Part I · Ayat 1–185" straight after the title
    for i, ln in enumerate(lines[:4]):
        pm = re.match(r'^##\s+(Part\s+([IVX]+)\b.*)$', ln.strip())
        if pm:
            part_label = pm[1].strip()
            part = part or ROMAN.get(pm[2], None)
            del lines[i]
            break

    subtitle = ''
    for ln in lines[:6]:
        s = ln.strip()
        if s.startswith('*') and s.endswith('*') and len(s) > 2:
            subtitle = s[1:-1].strip()
            break

    rev = None
    if re.search(r'\bMakkah\b|\bMakki|\bMeccan', subtitle):
        rev = 'makkah'
    if re.search(r'\bMadinah\b|\bMadani|\bMedinan', subtitle):
        rev = 'madinah' if rev is None else 'mixed'

    body = '\n'.join(lines).lstrip('\n')

    fm = ['---', f'surahs: [{", ".join(map(str, surahs))}]', f'name: {yaml_str(name)}',
          f'title: {yaml_str(title)}']
    if part:
        fm.append(f'part: {part}')
    if part_label:
        fm.append(f'part_label: {yaml_str(part_label)}')
    if subtitle:
        fm.append(f'subtitle: {yaml_str(subtitle)}')
    if rev:
        fm.append(f'revelation_note: {rev}')
    fm.append(f'source: {yaml_str("Quran Tafsir project: " + stem + ".txt")}')
    fm.append('author: owner')
    fm.append('---')

    slug = f'{surahs[0]:03d}-{slugify(name)}' + (f'-part-{part}' if part else '')
    return slug, '\n'.join(fm) + '\n\n' + body


def main():
    src = sys.argv[1]
    dst = sys.argv[2] if len(sys.argv) > 2 else 'content/tafsir'
    os.makedirs(dst, exist_ok=True)
    n = 0
    covered = set()
    for f in sorted(os.listdir(src)):
        if not re.match(r'^\d{3}', f) or not f.endswith(('.txt', '.md')):
            continue
        slug, out = convert(os.path.join(src, f))
        with open(os.path.join(dst, slug + '.md'), 'w', encoding='utf-8') as fh:
            fh.write(out)
        covered.update(parse_name(os.path.splitext(f)[0])[0])
        n += 1
    missing = sorted(set(range(1, 115)) - covered)
    print(f'Imported {n} docs covering {len(covered)} surahs.')
    if missing:
        print('Missing surahs:', missing)


if __name__ == '__main__':
    main()
