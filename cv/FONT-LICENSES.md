# Font provenance

No font binaries are stored in this source directory. The build obtains the
following original, unmodified font programs from the TeX distribution and
embeds subsets in the resulting document.

- **Linux Libertine 5.3.0**: `LinLibertineT`, `LinLibertineTB`, and
  `LinLibertineTI`, by Philipp H. Poll; Type 1 conversion and LaTeX support
  maintained by Bob Tennent. The font notices specify the **GNU General Public
  License version 2 with the font exception** and the **SIL Open Font License**.
  The LaTeX support files use the LaTeX Project Public License.
  [Upstream package and licenses](https://ctan.org/pkg/libertine);
  [upstream README](https://mirrors.ctan.org/fonts/libertine/README).
- **`txsys`**, the math symbol font supplying the hollow circular bullets,
  comes through `newtxmath` (the txfonts/newtx family). The original txfonts
  are distributed under the GNU GPL;
  the newtx package uses the **LaTeX Project Public License**.
  [txfonts package](https://ctan.org/pkg/txfonts);
  [newtx package and license](https://ctan.org/pkg/newtx);
  [newtx README](https://mirrors.ctan.org/fonts/newtx/README).

The Libertine font program embedded by the verified compiler contains this
copyright notice:

```text
Linux Libertine by Philipp H. Poll,
Open Font under Terms of following Free Software Licenses:
GPL (General Public License) with font-exception and OFL
(Open Font License).
Created with FontForge (http://fontforge.sf.net)
Sept 2003, 2004, 2005, 2006, 2007, 2008, 2009, 2010, 2011,2012
```

The PDF is a document using the fonts, not a redistributed font installation.
If font binaries are ever added to the repository separately, retain their
complete upstream licenses and copyright notices with those files.
