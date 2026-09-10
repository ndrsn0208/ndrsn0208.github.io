# Typography studies

Self-hosted Latin variable webfonts downloaded from Google Fonts on 2026-09-10.
Every family includes its original SIL Open Font License.

| Family | Weights | Styles | Upstream |
| --- | --- | --- | --- |
| EB Garamond | 400–800 | Roman, italic | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/ebgaramond) |
| Newsreader | 200–800 | Roman, italic | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/newsreader) |
| Source Sans 3 | 200–900 | Roman, italic | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/sourcesans3) |
| Cormorant Garamond | 300–700 | Roman, italic | [Google Fonts](https://github.com/google/fonts/tree/main/ofl/cormorantgaramond) |

The declarations live in `src/designs/typography/fonts.css`. Only the typography
review route loads that stylesheet; browsers fetch only the faces used by a
selected study. The approved homepage retains its existing fonts.
