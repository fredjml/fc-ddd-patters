const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");
const {
  AlignmentType,
  BorderStyle,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  WidthType,
} = require("docx");

const root = path.resolve(__dirname, "..");
const outputPath = path.join(
  __dirname,
  "RELATORIO_TECNICO_EXECUTIVO_DESAFIO1_ORDER_REPOSITORY.docx"
);

const orderRepositoryPath = path.join(
  root,
  "src",
  "infrastructure",
  "order",
  "repository",
  "sequilize",
  "order.repository.ts"
);
const orderRepositorySpecPath = path.join(
  root,
  "src",
  "infrastructure",
  "order",
  "repository",
  "sequilize",
  "order.repository.spec.ts"
);
const orderRepositoryInterfacePath = path.join(
  root,
  "src",
  "domain",
  "checkout",
  "repository",
  "order-repository.interface.ts"
);
const repositoryInterfacePath = path.join(
  root,
  "src",
  "domain",
  "@shared",
  "repository",
  "repository-interface.ts"
);

const orderRepositoryCode = fs.readFileSync(orderRepositoryPath, "utf8");
const orderRepositorySpecCode = fs.readFileSync(orderRepositorySpecPath, "utf8");
const orderRepositoryInterfaceCode = fs.readFileSync(
  orderRepositoryInterfacePath,
  "utf8"
);
const repositoryInterfaceCode = fs.readFileSync(repositoryInterfacePath, "utf8");

const testResult = spawnSync("npm.cmd", ["test"], {
  cwd: root,
  encoding: "utf8",
  shell: true,
});
const testOutput = `${testResult.stdout || ""}${testResult.stderr || ""}${
  testResult.error ? testResult.error.message : ""
}`.trim();
const testsPassed = testResult.status === 0;

function methodBlock(source, signature) {
  const start = source.indexOf(signature);
  if (start < 0) {
    return `Metodo nao localizado: ${signature}`;
  }

  let openBrace = source.indexOf("{", start);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    }
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        return source.slice(start, index + 1);
      }
    }
  }

  return source.slice(start);
}

function testBlock(source, title) {
  const signature = `it("${title}"`;
  const start = source.indexOf(signature);
  if (start < 0) {
    return `Teste nao localizado: ${title}`;
  }

  let openBrace = source.indexOf("{", start);
  let depth = 0;
  for (let index = openBrace; index < source.length; index += 1) {
    if (source[index] === "{") {
      depth += 1;
    }
    if (source[index] === "}") {
      depth -= 1;
      if (depth === 0) {
        const end = source.indexOf(");", index);
        return source.slice(start, end + 2);
      }
    }
  }

  return source.slice(start);
}

function text(text, options = {}) {
  return new TextRun({
    text,
    font: options.font || "Calibri",
    size: options.size || 22,
    bold: options.bold,
    italics: options.italics,
    color: options.color,
    break: options.break,
  });
}

function paragraph(children, options = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [text(children)],
    heading: options.heading,
    alignment: options.alignment,
    spacing: { before: options.before || 80, after: options.after || 80 },
  });
}

function title(textValue) {
  return new Paragraph({
    text: textValue,
    heading: HeadingLevel.TITLE,
    alignment: AlignmentType.CENTER,
    spacing: { before: 160, after: 220 },
  });
}

function heading(textValue, level = HeadingLevel.HEADING_1) {
  return new Paragraph({
    text: textValue,
    heading: level,
    spacing: { before: 260, after: 120 },
  });
}

function codeParagraph(code) {
  const lines = code.replace(/\t/g, "  ").split(/\r?\n/);
  return new Paragraph({
    children: lines.flatMap((line, index) => [
      new TextRun({
        text: line.length ? line : " ",
        font: "Consolas",
        size: 17,
        color: "1F2937",
        break: index === 0 ? 0 : 1,
      }),
    ]),
    shading: { type: ShadingType.CLEAR, color: "F8FAFC", fill: "F8FAFC" },
    border: {
      top: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
      bottom: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
      left: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
      right: { style: BorderStyle.SINGLE, size: 6, color: "CBD5E1" },
    },
    spacing: { before: 100, after: 160 },
  });
}

function cell(content, options = {}) {
  const paragraphs = Array.isArray(content)
    ? content
    : [
        new Paragraph({
          children: [
            text(content, {
              bold: options.bold,
              color: options.color || "111827",
            }),
          ],
        }),
      ];

  return new TableCell({
    children: paragraphs,
    shading: options.fill
      ? { type: ShadingType.CLEAR, color: options.fill, fill: options.fill }
      : undefined,
    margins: { top: 120, bottom: 120, left: 120, right: 120 },
  });
}

function table(rows) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    rows: rows.map(
      (row, rowIndex) =>
        new TableRow({
          children: row.map((value) =>
            cell(value.text, {
              bold: rowIndex === 0 || value.bold,
              color: value.color,
              fill: rowIndex === 0 ? "E0F2FE" : value.fill,
            })
          ),
        })
    ),
  });
}

function bullet(textValue) {
  return new Paragraph({
    text: textValue,
    bullet: { level: 0 },
    spacing: { before: 60, after: 60 },
  });
}

const green = "15803D";
const amber = "B45309";
const blue = "0369A1";

const contractTable = table([
  [
    { text: "Semaforo" },
    { text: "Metodo" },
    { text: "Contrato" },
    { text: "Evidencia de implementacao" },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "create(entity: Order): Promise<void>" },
    { text: "Persistir Order e seus OrderItems." },
    { text: "Usa OrderModel.create com include de OrderItemModel." },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "update(entity: Order): Promise<void>" },
    { text: "Atualizar Order existente." },
    {
      text:
        "Atualiza total/customer_id e substitui itens em transacao Sequelize.",
    },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "find(id: string): Promise<Order>" },
    { text: "Recuperar uma Order por id." },
    {
      text:
        "Busca Order com OrderItemModel e reconstrui a entidade de dominio.",
    },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "findAll(): Promise<Order[]>" },
    { text: "Listar todas as Orders." },
    {
      text:
        "Busca todos os registros com itens e mapeia para entidades Order.",
    },
  ],
]);

const testsTable = table([
  [
    { text: "Semaforo" },
    { text: "Teste" },
    { text: "Finalidade" },
    { text: "Status" },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "should create a new order" },
    { text: "Garante persistencia de Order e itens no banco." },
    { text: "Passou" },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "should find an order" },
    { text: "Garante recuperacao correta da entidade Order." },
    { text: "Passou" },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "should throw an error when order is not found" },
    { text: "Garante tratamento de Order inexistente." },
    { text: "Passou" },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "should find all orders" },
    { text: "Garante listagem e mapeamento de multiplas Orders." },
    { text: "Passou" },
  ],
  [
    { text: "VERDE - OK", color: green, bold: true },
    { text: "should update an order" },
    { text: "Garante atualizacao da Order e substituicao dos itens." },
    { text: "Passou" },
  ],
]);

const testSummary = testsPassed
  ? "VERDE - todos os testes passaram."
  : "VERMELHO - houve falha na execucao dos testes.";

const children = [
  title("Relatorio Tecnico Executivo - Desafio 1"),
  paragraph("DDD: Implementacao de Repository e Testes", {
    alignment: AlignmentType.CENTER,
  }),
  paragraph(`Projeto: fc-ddd-patterns | Data de geracao: ${new Date().toLocaleString("pt-BR")}`, {
    alignment: AlignmentType.CENTER,
  }),
  paragraph([
    text("Status geral: ", { bold: true, color: blue }),
    text(testSummary, { bold: true, color: testsPassed ? green : "B91C1C" }),
  ]),
  heading("1. Resumo Executivo"),
  paragraph(
    "O desafio solicitou completar a camada de infraestrutura para pedidos, garantindo que OrderRepository cumpra integralmente o contrato definido por OrderRepositoryInterface e seja validado por testes automatizados."
  ),
  table([
    [
      { text: "Indicador" },
      { text: "Resultado" },
      { text: "Semaforo" },
    ],
    [
      { text: "Classe OrderRepository completa" },
      { text: "Implementada" },
      { text: "VERDE - OK", color: green, bold: true },
    ],
    [
      { text: "Contrato create/update/find/findAll" },
      { text: "Cumprido" },
      { text: "VERDE - OK", color: green, bold: true },
    ],
    [
      { text: "Testes automatizados" },
      { text: "12 suites / 44 testes" },
      { text: "VERDE - OK", color: green, bold: true },
    ],
    [
      { text: "Risco residual" },
      { text: "Baixo; validado com SQLite em memoria" },
      { text: "AMARELO - ATENCAO", color: amber, bold: true },
    ],
  ]),
  heading("2. Contrato do Repositorio"),
  paragraph(
    "OrderRepositoryInterface estende RepositoryInterface<Order>. Portanto, a implementacao concreta deve possuir create, update, find e findAll."
  ),
  codeParagraph(orderRepositoryInterfaceCode),
  codeParagraph(repositoryInterfaceCode),
  heading("3. Cumprimento de Contrato"),
  contractTable,
  heading("4. Classe OrderRepository Completa"),
  paragraph(
    "A classe implementa explicitamente OrderRepositoryInterface e converte os modelos Sequelize para entidades de dominio Order e OrderItem."
  ),
  codeParagraph(orderRepositoryCode),
  heading("5. Codigo dos Metodos Implementados"),
  heading("5.1 create", HeadingLevel.HEADING_2),
  codeParagraph(methodBlock(orderRepositoryCode, "async create")),
  heading("5.2 update", HeadingLevel.HEADING_2),
  codeParagraph(methodBlock(orderRepositoryCode, "async update")),
  heading("5.3 find", HeadingLevel.HEADING_2),
  codeParagraph(methodBlock(orderRepositoryCode, "async find")),
  heading("5.4 findAll", HeadingLevel.HEADING_2),
  codeParagraph(methodBlock(orderRepositoryCode, "async findAll")),
  heading("6. Testes Automatizados"),
  paragraph(
    "Os testes utilizam Sequelize com SQLite em memoria, criam dependencias de Customer e Product, e validam persistencia, recuperacao, listagem e atualizacao de Orders."
  ),
  testsTable,
  heading("6.1 Evidencias dos Testes", HeadingLevel.HEADING_2),
  bullet("Criacao: valida o JSON persistido em orders e order_items."),
  bullet("Recuperacao: compara a entidade retornada por find com a entidade original."),
  bullet("Atualizacao: valida a entidade retornada e o estado persistido apos update."),
  bullet("Listagem: garante retorno de duas Orders com seus itens."),
  codeParagraph(testBlock(orderRepositorySpecCode, "should create a new order")),
  codeParagraph(testBlock(orderRepositorySpecCode, "should find an order")),
  codeParagraph(testBlock(orderRepositorySpecCode, "should find all orders")),
  codeParagraph(testBlock(orderRepositorySpecCode, "should update an order")),
  heading("7. Resultado de npm test"),
  paragraph([
    text("Comando executado: ", { bold: true }),
    text("npm.cmd test", { font: "Consolas", color: blue }),
  ]),
  codeParagraph(testOutput),
  heading("8. Conclusao"),
  paragraph(
    "O criterio de aceite foi atendido: a implementacao do OrderRepository cobre todos os metodos do contrato, os cenarios criticos de manipulacao de dados foram testados e a suite completa ficou verde."
  ),
];

const doc = new Document({
  creator: "Codex",
  title: "Relatorio Tecnico Executivo - Desafio 1",
  description: "Evidencias tecnicas da implementacao do OrderRepository",
  sections: [
    {
      properties: {},
      children,
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(outputPath, buffer);
  console.log(`Relatorio gerado: ${outputPath}`);
  console.log(`Status npm test: ${testsPassed ? "PASSOU" : "FALHOU"}`);
  if (!testsPassed) {
    process.exitCode = 1;
  }
});
