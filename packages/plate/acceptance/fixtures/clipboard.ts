/**
 * Clipboard payloads for the paste pipelines of Aurora's editor preset.
 */

/**
 * HTML as Microsoft Word puts it on the clipboard: `Mso*` classes, `mso-*`
 * styles, list items encoded as paragraphs with `mso-list` and conditional
 * comments for the list markers. This is what triggers `DocxPlugin`'s cleanup.
 */
export const DOCX_HTML = `<html xmlns:o="urn:schemas-microsoft-com:office:office"
xmlns:w="urn:schemas-microsoft-com:office:word"
xmlns="http://www.w3.org/TR/REC-html40">
<head><meta name=ProgId content=Word.Document><meta name=Generator content="Microsoft Word 15"></head>
<body lang=EN-US style='tab-interval:.5in;word-wrap:break-word'>
<!--StartFragment-->
<h2>Word heading</h2>

<p class=MsoNormal>Word paragraph with <b>bold</b>, <i>italic</i> and a
<a href="https://plone.org">Word link</a>.<o:p></o:p></p>

<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol'><span
style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Word bullet one<o:p></o:p></p>

<p class=MsoListParagraphCxSpMiddle style='margin-left:1.0in;mso-add-space:auto;text-indent:-.25in;mso-list:l0 level2 lfo1'><![if !supportLists]><span
style='font-family:"Courier New";mso-fareast-font-family:"Courier New"'><span
style='mso-list:Ignore'>o<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;
</span></span></span><![endif]>Word bullet nested<o:p></o:p></p>

<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l0 level1 lfo1'><![if !supportLists]><span
style='font-family:Symbol;mso-fareast-font-family:Symbol;mso-bidi-font-family:Symbol'><span
style='mso-list:Ignore'>·<span style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Word bullet two<o:p></o:p></p>

<p class=MsoListParagraphCxSpFirst style='text-indent:-.25in;mso-list:l1 level1 lfo2'><![if !supportLists]><span
style='mso-bidi-font-family:Calibri'><span style='mso-list:Ignore'>1.<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Word number one<o:p></o:p></p>

<p class=MsoListParagraphCxSpLast style='text-indent:-.25in;mso-list:l1 level1 lfo2'><![if !supportLists]><span
style='mso-bidi-font-family:Calibri'><span style='mso-list:Ignore'>2.<span
style='font:7.0pt "Times New Roman"'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
</span></span></span><![endif]>Word number two<o:p></o:p></p>

<table class=MsoTableGrid border=1 cellspacing=0 cellpadding=0
 style='border-collapse:collapse;border:none;mso-border-alt:solid windowtext .5pt'>
 <tr>
  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt'>
  <p class=MsoNormal>Word cell A1<o:p></o:p></p></td>
  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt'>
  <p class=MsoNormal>Word cell B1<o:p></o:p></p></td>
 </tr>
 <tr>
  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt'>
  <p class=MsoNormal>Word cell A2<o:p></o:p></p></td>
  <td width=312 valign=top style='width:233.75pt;border:solid windowtext 1.0pt'>
  <p class=MsoNormal>Word cell B2<o:p></o:p></p></td>
 </tr>
</table>
<!--EndFragment-->
</body>
</html>`;

/** HTML as copied from a regular web page. */
export const WEB_HTML = `<meta charset="utf-8">
<h2>Web heading</h2>
<p>Web paragraph with <strong>bold</strong>, <em>italic</em> and a <a href="https://plone.org">web link</a>.</p>
<ul><li>Web bullet one</li><li>Web bullet two</li></ul>
<ol><li>Web number one</li><li>Web number two</li></ol>
<blockquote><p>Web quote</p></blockquote>
<pre><code>const web = true;</code></pre>
<table><tbody>
<tr><td>Web cell A1</td><td>Web cell B1</td></tr>
<tr><td>Web cell A2</td><td>Web cell B2</td></tr>
</tbody></table>`;

/** Markdown pasted as plain text. */
export const MARKDOWN_TEXT = `## Markdown heading

Markdown paragraph with **bold**, *italic* and a [markdown link](https://plone.org).

- Markdown bullet one
- Markdown bullet two

1. Markdown number one
2. Markdown number two

> Markdown quote

\`\`\`js
const markdown = true;
\`\`\`

| Markdown A | Markdown B |
| --- | --- |
| Markdown cell A2 | Markdown cell B2 |
`;
