import Link from 'next/link';

const links = [
  ['Quran', '/quran'],
  ['Player', '/player'],
  ['Tafsir', '/tafsir'],
  ['Seerah', '/seerah'],
  ['Names of Allah', '/names'],
  ['Duas', '/duas'],
  ['Wisdom', '/wisdom'],
];

export default function Nav() {
  return (
    <nav className="nav">
      <Link href="/" className="brand">Believe &amp; Do Good</Link>
      {links.map(([label, href]) => (
        <Link key={href} href={href} className="link">{label}</Link>
      ))}
    </nav>
  );
}
