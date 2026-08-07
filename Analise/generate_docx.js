const fs = require('fs');
const { Document, Packer, Paragraph, HeadingLevel, TextRun } = require('docx');

const mdPath = 'Analise/relatorio-executivo.md';
const outPath = 'Analise/RELATORIO_EXECUTIVO_FINAL_CODEBASE_FCDDDPATTERNS.docx';

function lineToParagraph(line) {
  if (line.startsWith('# ')) {
    return new Paragraph({ text: line.slice(2).trim(), heading: HeadingLevel.TITLE });
  }
  if (line.startsWith('## ')) {
    return new Paragraph({ text: line.slice(3).trim(), heading: HeadingLevel.HEADING_1 });
  }
  if (line.startsWith('### ')) {
    return new Paragraph({ text: line.slice(4).trim(), heading: HeadingLevel.HEADING_2 });
  }
  if (line.startsWith('- ')) {
    return new Paragraph({ text: line.slice(2).trim(), bullet: { level: 0 } });
  }
  if (line.trim() === '---') {
    // page break
    return new Paragraph({ children: [new TextRun({ text: '', break: 1 })] });
  }
  return new Paragraph({ text: line });
}

function main() {
  const md = fs.readFileSync(mdPath, 'utf8');
  const lines = md.split(/\r?\n/);
  const body = [];
  for (const line of lines) {
    if (line.trim() === '') {
      body.push(new Paragraph(''));
    } else {
      body.push(lineToParagraph(line));
    }
  }
  const doc = new Document({ creator: 'Analise', title: 'Relatório Executivo', description: 'Relatório Executivo — Análise do codebase', sections: [{ children: body }] });
  Packer.toBuffer(doc).then((buffer) => {
    fs.writeFileSync(outPath, buffer);
    console.log('Saved', outPath);
  }).catch((err) => {
    console.error(err);
  });
}

main();
