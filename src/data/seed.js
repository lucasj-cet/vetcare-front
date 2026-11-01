import dayjs from "dayjs";

// ---------------------------------------------------------------------------
// Dados de demonstração. Nada aqui é real: nomes, CPFs, telefones e valores
// existem só para o front ser visto com conteúdo. Quando a API estiver pronta,
// este arquivo deixa de ser usado (veja src/api/README.md).
// ---------------------------------------------------------------------------

export const PRICES = {
  Consulta: 180,
  Retorno: 90,
  Vacinação: 120,
  Exame: 220,
  "Consulta dermatológica": 240,
  "Avaliação cirúrgica": 260,
};
export const SERVICE_TYPES = Object.keys(PRICES);
export const DURATION = { Exame: 45, "Avaliação cirúrgica": 45 };

export const PAYMENT_METHODS = [
  "Cartão de crédito",
  "Cartão de débito",
  "PIX",
  "Dinheiro",
  "Boleto",
];

export const VACCINE_TYPES = {
  Cão: [
    "V10 Polivalente",
    "V8 Polivalente",
    "Antirrábica",
    "Gripe canina",
    "Giárdia",
    "Leishmaniose",
  ],
  Gato: ["V4 Felina", "V5 Felina", "Antirrábica", "FeLV"],
};

export const EXPENSE_CATEGORIES = [
  "Pessoal",
  "Estrutura",
  "Medicamentos e insumos",
  "Laboratório",
  "Impostos",
  "Outros",
];
export const INCOME_CATEGORIES = ["Atendimentos", "Vendas", "Outros"];

// gerador fixo, para o histórico sair sempre igual
function rng(seed) {
  return () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const hhmm = (m) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export function buildSeed() {
  const today = dayjs().startOf("day");
  const d = (n) => today.add(n, "day").format("YYYY-MM-DD");
  const ts = (n, time) => `${d(n)}T${time}`;
  const birth = (years, months = 0) =>
    today
      .subtract(years, "year")
      .subtract(months, "month")
      .format("YYYY-MM-DD");
  // próximo dia útil (a clínica não abre aos domingos)
  const workday = (n) => {
    let day = today.add(n, "day");
    if (day.day() === 0) day = day.add(1, "day");
    return day.format("YYYY-MM-DD");
  };

  const users = [
    {
      id: "u1",
      role: "recepcao",
      name: "Ana Costa",
      email: "ana.costa@vetcare.com.br",
      status: "ativo",
      lastSeen: ts(0, "07:52"),
    },
    {
      id: "u2",
      role: "vet",
      name: "Dra. Camila Rocha",
      email: "camila.rocha@vetcare.com.br",
      crmv: "CRMV-SP 41.287",
      status: "ativo",
      lastSeen: ts(0, "07:58"),
    },
    {
      id: "u3",
      role: "vet",
      name: "Dr. Rafael Nunes",
      email: "rafael.nunes@vetcare.com.br",
      crmv: "CRMV-SP 38.904",
      status: "ativo",
      lastSeen: ts(0, "08:11"),
    },
    {
      id: "u4",
      role: "admin",
      name: "Renata Freitas",
      email: "renata.freitas@vetcare.com.br",
      status: "ativo",
      lastSeen: ts(0, "08:30"),
    },
    {
      id: "u5",
      role: "admin",
      name: "Pedro Martins",
      email: "pedro.martins@vetcare.com.br",
      status: "convite",
      invitedAt: ts(-2, "16:40"),
    },
    {
      id: "u7",
      role: "recepcao",
      name: "Juliana Prado",
      email: "juliana.prado@vetcare.com.br",
      status: "inativo",
      lastSeen: ts(-48, "18:02"),
    },
    {
      id: "u6",
      role: "tutor",
      name: "Marina Ribeiro",
      email: "marina.ribeiro@email.com",
      tutorId: "t1",
      status: "ativo",
      lastSeen: ts(-1, "20:15"),
    },
  ];

  const tutors = [
    {
      id: "t1",
      name: "Marina Ribeiro",
      cpf: "312.457.890-12",
      phone: "(11) 98765-4321",
      email: "marina.ribeiro@email.com",
      address: "Rua Harmonia, 412 · Vila Madalena, São Paulo",
      createdAt: d(-420),
    },
    {
      id: "t2",
      name: "Carlos Mota",
      cpf: "208.334.561-70",
      phone: "(11) 99812-3307",
      email: "carlos.mota@email.com",
      address: "Av. Pompeia, 1180 · Pompeia, São Paulo",
      createdAt: d(-380),
    },
    {
      id: "t3",
      name: "Luana Reis",
      cpf: "455.120.338-04",
      phone: "(11) 97733-5190",
      email: "luana.reis@email.com",
      address: "Rua Cardeal Arcoverde, 90 · Pinheiros, São Paulo",
      createdAt: d(-300),
    },
    {
      id: "t4",
      name: "Mariana Lopes",
      cpf: "127.903.442-56",
      phone: "(11) 98120-6644",
      email: "mariana.lopes@email.com",
      address: "Rua Girassol, 233 · Vila Madalena, São Paulo",
      createdAt: d(-260),
    },
    {
      id: "t5",
      name: "Bruno Alves",
      cpf: "390.276.115-88",
      phone: "(11) 99456-0071",
      email: "bruno.alves@email.com",
      address: "Rua Fradique Coutinho, 701 · Pinheiros, São Paulo",
      createdAt: d(-200),
    },
    {
      id: "t6",
      name: "Fernanda Lima",
      cpf: "521.884.019-33",
      phone: "(11) 98003-2218",
      email: "fernanda.lima@email.com",
      address: "Rua Aspicuelta, 55 · Vila Madalena, São Paulo",
      createdAt: d(-150),
    },
    {
      id: "t7",
      name: "João Pedro Santos",
      cpf: "264.519.773-41",
      phone: "(11) 97650-8823",
      email: "joaopedro.santos@email.com",
      address: "Rua Heitor Penteado, 1500 · Sumarezinho, São Paulo",
      createdAt: d(-60),
    },
    {
      id: "t8",
      name: "Patrícia Gomes",
      cpf: "187.640.225-09",
      phone: "(11) 99230-4456",
      email: "patricia.gomes@email.com",
      address: "Rua Mourato Coelho, 1020 · Pinheiros, São Paulo",
      createdAt: d(-12),
    },
  ];

  const pets = [
    {
      id: "p1",
      tutorId: "t1",
      name: "Thor",
      species: "Cão",
      breed: "Golden Retriever",
      sex: "Macho",
      birth: birth(4, 2),
      weight: 32,
      alerts: "",
    },
    {
      id: "p2",
      tutorId: "t1",
      name: "Mel",
      species: "Gato",
      breed: "SRD",
      sex: "Fêmea",
      birth: birth(2, 5),
      weight: 4.1,
      alerts: "",
    },
    {
      id: "p3",
      tutorId: "t2",
      name: "Theo",
      species: "Cão",
      breed: "SRD",
      sex: "Macho",
      birth: birth(6),
      weight: 14.5,
      alerts: "",
    },
    {
      id: "p4",
      tutorId: "t3",
      name: "Maya",
      species: "Cão",
      breed: "Shih-tzu",
      sex: "Fêmea",
      birth: birth(3, 1),
      weight: 6.2,
      alerts: "",
    },
    {
      id: "p5",
      tutorId: "t4",
      name: "Luna",
      species: "Gato",
      breed: "Maine Coon",
      sex: "Fêmea",
      birth: birth(5, 4),
      weight: 6.8,
      alerts: "",
    },
    {
      id: "p6",
      tutorId: "t5",
      name: "Nina",
      species: "Cão",
      breed: "Bulldog francês",
      sex: "Fêmea",
      birth: birth(2, 8),
      weight: 11.3,
      alerts: "Alergia a dipirona",
    },
    {
      id: "p7",
      tutorId: "t6",
      name: "Bidu",
      species: "Cão",
      breed: "Beagle",
      sex: "Macho",
      birth: birth(8, 3),
      weight: 13.9,
      alerts: "",
    },
    {
      id: "p8",
      tutorId: "t7",
      name: "Pipoca",
      species: "Gato",
      breed: "SRD",
      sex: "Fêmea",
      birth: birth(1, 2),
      weight: 3.2,
      alerts: "",
    },
    {
      id: "p9",
      tutorId: "t8",
      name: "Fred",
      species: "Cão",
      breed: "Lhasa Apso",
      sex: "Macho",
      birth: birth(10, 6),
      weight: 7.4,
      alerts: "Cardiopata: avaliar antes de qualquer sedação",
    },
  ];
  const petName = Object.fromEntries(pets.map((p) => [p.id, p.name]));

  const appointments = [];
  const charges = [];
  let aSeq = 1;
  let cSeq = 1;
  const add = (a) => {
    const row = {
      id: `a${aSeq++}`,
      duration: DURATION[a.type] ?? 30,
      source: "recepcao",
      notes: "",
      ...a,
    };
    appointments.push(row);
    return row;
  };
  const charge = (c) =>
    charges.push({ id: `c${cSeq++}`, installments: 1, ...c });

  // ---- hoje ----
  const t = d(0);
  const luna = add({
    petId: "p5",
    vetId: "u2",
    date: t,
    time: "08:00",
    type: "Consulta",
    status: "concluida",
    notes: "Revisão pós-castração",
  });
  const pipoca = add({
    petId: "p8",
    vetId: "u3",
    date: t,
    time: "08:30",
    type: "Vacinação",
    status: "concluida",
    notes: "Antirrábica",
  });
  add({
    petId: "p3",
    vetId: "u3",
    date: t,
    time: "09:30",
    type: "Retorno",
    status: "em_atendimento",
    notes: "Retorno da otite",
  });
  add({
    petId: "p1",
    vetId: "u2",
    date: t,
    time: "10:30",
    type: "Consulta",
    status: "aguardando",
    notes: "Consulta preventiva",
  });
  add({
    petId: "p4",
    vetId: "u2",
    date: t,
    time: "11:00",
    type: "Vacinação",
    status: "agendada",
    notes: "V10 anual",
  });
  add({
    petId: "p6",
    vetId: "u2",
    date: t,
    time: "14:00",
    type: "Consulta dermatológica",
    status: "agendada",
    notes: "Coceira e vermelhidão nas orelhas",
  });
  add({
    petId: "p7",
    vetId: "u3",
    date: t,
    time: "15:00",
    type: "Exame",
    status: "agendada",
    notes: "Hemograma e bioquímico",
  });
  add({
    petId: "p9",
    vetId: "u3",
    date: t,
    time: "16:30",
    type: "Avaliação cirúrgica",
    status: "agendada",
    notes: "Tartarectomia",
  });

  // pedidos feitos pelos tutores no portal, esperando a recepção confirmar
  add({
    petId: "p2",
    vetId: null,
    date: workday(2),
    time: "10:00",
    type: "Consulta",
    status: "solicitada",
    source: "tutor",
    notes: "Está comendo pouco há 3 dias",
    requestedAt: ts(-1, "20:12"),
  });
  add({
    petId: "p3",
    vetId: "u3",
    date: workday(3),
    time: "15:30",
    type: "Retorno",
    status: "solicitada",
    source: "tutor",
    notes: "",
    requestedAt: ts(0, "07:40"),
  });

  // próximos dias
  add({
    petId: "p4",
    vetId: "u2",
    date: workday(1),
    time: "09:00",
    type: "Consulta",
    status: "agendada",
  });
  add({
    petId: "p8",
    vetId: "u3",
    date: workday(1),
    time: "10:30",
    type: "Exame",
    status: "agendada",
  });
  add({
    petId: "p7",
    vetId: "u2",
    date: workday(1),
    time: "14:30",
    type: "Retorno",
    status: "agendada",
  });
  add({
    petId: "p5",
    vetId: "u2",
    date: workday(4),
    time: "11:30",
    type: "Retorno",
    status: "agendada",
    notes: "Retirada de pontos",
  });
  add({
    petId: "p9",
    vetId: "u3",
    date: workday(5),
    time: "08:30",
    type: "Exame",
    status: "agendada",
    notes: "Ecocardiograma",
  });
  add({
    petId: "p1",
    vetId: "u2",
    date: workday(14),
    time: "14:00",
    type: "Retorno",
    status: "agendada",
    notes: "Retorno dermatológico",
  });

  // ---- histórico: ~10 semanas de atendimentos concluídos e pagos ----
  const rand = rng(20261031);
  const pick = (weights) => {
    let r = rand();
    for (const [value, p] of weights) if ((r -= p) <= 0) return value;
    return weights[0][0];
  };
  const methods = [
    ["Cartão de crédito", 0.3],
    ["Cartão de débito", 0.18],
    ["PIX", 0.34],
    ["Dinheiro", 0.12],
    ["Boleto", 0.06],
  ];
  const types = [
    ["Consulta", 0.42],
    ["Retorno", 0.18],
    ["Vacinação", 0.2],
    ["Exame", 0.12],
    ["Consulta dermatológica", 0.05],
    ["Avaliação cirúrgica", 0.03],
  ];
  const petIds = pets.map((p) => p.id);
  for (let i = 72; i >= 1; i--) {
    const day = today.subtract(i, "day");
    if (day.day() === 0) continue;
    const n =
      day.day() === 6 ? 4 + Math.floor(rand() * 3) : 7 + Math.floor(rand() * 5);
    const used = new Set();
    for (let k = 0; k < n; k++) {
      const vetId = rand() < 0.55 ? "u2" : "u3";
      let slot;
      do slot = 8 * 60 + Math.floor(rand() * 20) * 30;
      while (used.has(vetId + slot));
      used.add(vetId + slot);
      const type = pick(types);
      const cancelled = rand() < 0.05;
      const petId = petIds[Math.floor(rand() * petIds.length)];
      const a = add({
        petId,
        vetId,
        date: day.format("YYYY-MM-DD"),
        time: hhmm(slot),
        type,
        status: cancelled ? "cancelada" : "concluida",
      });
      if (!cancelled) {
        const extra = type === "Exame" ? Math.round(rand() * 4) * 40 : 0;
        charge({
          appointmentId: a.id,
          petId,
          vetId,
          description: `${type} · ${petName[petId]}`,
          amount: PRICES[type] + extra,
          status: "pago",
          method: pick(methods),
          createdAt: `${a.date}T${hhmm(slot + 30)}`,
          paidAt: `${a.date}T${hhmm(slot + 40)}`,
        });
      }
    }
  }

  // ---- caixa de hoje ----
  charge({
    appointmentId: luna.id,
    petId: "p5",
    vetId: "u2",
    description: "Consulta · Luna",
    amount: 180,
    status: "pago",
    method: "PIX",
    createdAt: ts(0, "08:35"),
    paidAt: ts(0, "08:41"),
  });
  charge({
    petId: "p7",
    description: "Venda · Ração gastrointestinal 10 kg",
    amount: 289.9,
    status: "pago",
    method: "Cartão de crédito",
    installments: 2,
    createdAt: ts(0, "09:10"),
    paidAt: ts(0, "09:12"),
  });
  charge({
    petId: "p4",
    description: "Venda · Antipulgas 3 doses",
    amount: 154,
    status: "pago",
    method: "PIX",
    createdAt: ts(0, "10:05"),
    paidAt: ts(0, "10:06"),
  });
  charge({
    appointmentId: pipoca.id,
    petId: "p8",
    vetId: "u3",
    description: "Vacinação · Pipoca",
    amount: 120,
    status: "pendente",
    createdAt: ts(0, "08:58"),
  });
  charge({
    petId: "p6",
    vetId: "u2",
    description: "Exames laboratoriais · Nina",
    amount: 420,
    status: "pendente",
    createdAt: ts(-3, "15:20"),
    dueAt: d(4),
  });
  charge({
    petId: "p9",
    vetId: "u3",
    description: "Consulta · Fred",
    amount: 180,
    status: "pendente",
    createdAt: ts(-1, "17:40"),
  });

  // ---- vacinas ----
  const vaccines = [
    {
      id: "v1",
      petId: "p1",
      name: "V10 Polivalente",
      status: "aplicada",
      appliedAt: d(-165),
      lot: "V10-2504",
      vetId: "u2",
    },
    {
      id: "v2",
      petId: "p1",
      name: "Antirrábica",
      status: "aplicada",
      appliedAt: d(-360),
      lot: "RAB-1187",
      vetId: "u2",
    },
    {
      id: "v3",
      petId: "p1",
      name: "Antirrábica",
      status: "agendada",
      dueAt: d(5),
    },
    {
      id: "v4",
      petId: "p1",
      name: "Gripe canina",
      status: "agendada",
      dueAt: d(19),
    },
    {
      id: "v5",
      petId: "p1",
      name: "V10 Polivalente",
      status: "agendada",
      dueAt: d(200),
    },
    {
      id: "v17",
      petId: "p1",
      name: "Giárdia",
      status: "aplicada",
      appliedAt: d(-165),
      lot: "GIA-0412",
      vetId: "u2",
    },
    {
      id: "v6",
      petId: "p2",
      name: "V4 Felina",
      status: "aplicada",
      appliedAt: d(-60),
      lot: "V4F-0921",
      vetId: "u3",
    },
    {
      id: "v7",
      petId: "p2",
      name: "V4 Felina",
      status: "agendada",
      dueAt: d(305),
    },
    {
      id: "v8",
      petId: "p3",
      name: "Gripe canina",
      status: "agendada",
      dueAt: d(-9),
    },
    {
      id: "v9",
      petId: "p4",
      name: "V10 Polivalente",
      status: "agendada",
      dueAt: d(0),
    },
    {
      id: "v15",
      petId: "p4",
      name: "Antirrábica",
      status: "aplicada",
      appliedAt: d(-120),
      lot: "RAB-1150",
      vetId: "u2",
    },
    {
      id: "v10",
      petId: "p6",
      name: "Antirrábica",
      status: "agendada",
      dueAt: d(-3),
    },
    {
      id: "v11",
      petId: "p5",
      name: "V5 Felina",
      status: "agendada",
      dueAt: d(-15),
    },
    {
      id: "v12",
      petId: "p8",
      name: "Antirrábica",
      status: "aplicada",
      appliedAt: d(0),
      lot: "RAB-1204",
      vetId: "u3",
    },
    {
      id: "v13",
      petId: "p8",
      name: "Antirrábica",
      status: "agendada",
      dueAt: d(365),
    },
    {
      id: "v14",
      petId: "p7",
      name: "V10 Polivalente",
      status: "agendada",
      dueAt: d(3),
    },
    {
      id: "v16",
      petId: "p9",
      name: "V10 Polivalente",
      status: "aplicada",
      appliedAt: d(-30),
      lot: "V10-2511",
      vetId: "u3",
    },
  ];

  // ---- prontuário ----
  const records = [
    {
      id: "r1",
      petId: "p1",
      vetId: "u2",
      date: d(-165),
      type: "Consulta",
      weight: 31.6,
      temperature: 38.5,
      complaint: "Coceira nas patas e lambedura constante",
      exam: "Eritema interdigital nas quatro patas, sem lesões abertas",
      diagnosis: "Dermatite atópica",
      conduct:
        "Iniciar oclacitinib e banhos com clorexidina. Vacinas V10 e Giárdia aplicadas.",
    },
    {
      id: "r2",
      petId: "p1",
      vetId: "u2",
      date: d(-60),
      type: "Consulta dermatológica",
      weight: 32.2,
      temperature: 38.3,
      complaint: "Retorno da dermatite, coceira voltou após parar o remédio",
      exam: "Melhora parcial, eritema leve",
      diagnosis: "Dermatite atópica em controle",
      conduct: "Retomar tratamento por 14 dias. Hemograma solicitado.",
    },
    {
      id: "r3",
      petId: "p6",
      vetId: "u2",
      date: d(-30),
      type: "Consulta",
      weight: 11.1,
      temperature: 39.1,
      complaint: "Balança a cabeça e coça as orelhas",
      exam: "Secreção escura no conduto auditivo direito",
      diagnosis: "Otite externa",
      conduct:
        "Limpeza otológica e antibiótico tópico. Reação a dipirona relatada pela tutora: registrado alerta.",
    },
    {
      id: "r4",
      petId: "p9",
      vetId: "u3",
      date: d(-20),
      type: "Consulta",
      weight: 7.4,
      temperature: 38.2,
      complaint: "Cansaço em passeios curtos",
      exam: "Sopro sistólico grau II/VI em foco mitral",
      diagnosis: "Doença valvar mitral (estágio B1)",
      conduct:
        "Ecocardiograma em 30 dias. Evitar sedação sem avaliação cardiológica.",
    },
    {
      id: "r5",
      petId: "p4",
      vetId: "u2",
      date: d(-4),
      type: "Consulta",
      weight: 6.2,
      temperature: 39.4,
      complaint: "Tosse e secreção nasal há 2 dias",
      exam: "Linfonodos submandibulares aumentados",
      diagnosis: "Infecção respiratória bacteriana",
      conduct: "Antibioticoterapia por 10 dias.",
    },
    {
      id: "r6",
      petId: "p5",
      vetId: "u2",
      date: d(-10),
      type: "Avaliação cirúrgica",
      weight: 6.9,
      temperature: 38.6,
      complaint: "Castração eletiva",
      exam: "Apta para o procedimento",
      diagnosis: "Ovariohisterectomia realizada sem intercorrências",
      conduct: "Analgésico e antibiótico por 5 dias, colar elizabetano.",
    },
    {
      id: "r7",
      petId: "p5",
      vetId: "u2",
      date: d(0),
      appointmentId: luna.id,
      type: "Consulta",
      weight: 6.8,
      temperature: 38.4,
      complaint: "Revisão pós-castração",
      exam: "Ferida limpa, sem secreção",
      diagnosis: "Cicatrização adequada",
      conduct: "Retirada de pontos em 4 dias.",
    },
  ];

  const prescriptions = [
    {
      id: "rx1",
      petId: "p1",
      vetId: "u2",
      date: d(-60),
      title: "Prescrição dermatológica",
      status: "emitida",
      items: [
        {
          drug: "Oclacitinib 16 mg",
          dose: "1 comprimido",
          frequency: "a cada 12 horas",
          duration: "14 dias",
        },
        {
          drug: "Shampoo clorexidina 2%",
          dose: "banho completo",
          frequency: "2 vezes por semana",
          duration: "4 semanas",
        },
      ],
      notes: "Deixar o shampoo agir por 10 minutos antes de enxaguar.",
    },
    {
      id: "rx2",
      petId: "p5",
      vetId: "u2",
      date: d(-10),
      title: "Prescrição pós-operatória",
      status: "emitida",
      items: [
        {
          drug: "Meloxicam 0,5 mg/ml",
          dose: "0,3 ml",
          frequency: "1 vez ao dia",
          duration: "3 dias",
        },
        {
          drug: "Cefalexina 150 mg",
          dose: "1 comprimido",
          frequency: "a cada 12 horas",
          duration: "5 dias",
        },
      ],
      notes: "Manter o colar elizabetano até a retirada dos pontos.",
    },
    {
      id: "rx3",
      petId: "p4",
      vetId: "u2",
      date: d(-4),
      title: "Antibioticoterapia",
      status: "emitida",
      items: [
        {
          drug: "Amoxicilina + clavulanato 250 mg",
          dose: "1/2 comprimido",
          frequency: "a cada 12 horas",
          duration: "10 dias",
        },
      ],
      notes: "Dar junto com a comida.",
    },
    {
      id: "rx4",
      petId: "p6",
      vetId: "u2",
      date: d(-30),
      title: "Tratamento da otite",
      status: "emitida",
      items: [
        {
          drug: "Otológico com gentamicina",
          dose: "5 gotas no ouvido direito",
          frequency: "a cada 12 horas",
          duration: "7 dias",
        },
      ],
      notes: "Não usar dipirona (alergia).",
    },
  ];

  const exams = [
    {
      id: "ex1",
      petId: "p1",
      date: d(-58),
      title: "Resultado de hemograma",
      lab: "VetLab Diagnósticos",
      summary:
        "Hemograma completo dentro dos valores de referência. Eosinófilos no limite superior, compatível com quadro alérgico.",
    },
    {
      id: "ex2",
      petId: "p6",
      date: d(-29),
      title: "Citologia otológica",
      lab: "VetLab Diagnósticos",
      summary:
        "Presença de cocos e leveduras (Malassezia) em quantidade moderada.",
    },
  ];

  // ---- despesas lançadas no financeiro (as receitas vêm do caixa) ----
  const movements = [];
  const fixed = [
    [5, "Folha de pagamento", "Pessoal", 12450],
    [10, "Aluguel do imóvel", "Estrutura", 6800],
    [12, "Fornecedor de medicamentos", "Medicamentos e insumos", 4280],
    [15, "Energia elétrica", "Estrutura", 1140],
    [20, "Laboratório parceiro", "Laboratório", 2300],
    [25, "Simples Nacional", "Impostos", 3150],
  ];
  let mSeq = 1;
  for (let back = 2; back >= 0; back--) {
    const month = today.subtract(back, "month").startOf("month");
    for (const [day, description, category, amount] of fixed) {
      const date = month.date(Math.min(day, month.daysInMonth()));
      if (date.isAfter(today)) continue;
      const wobble =
        category === "Estrutura" && description.startsWith("Energia")
          ? Math.round((rand() - 0.5) * 240)
          : 0;
      movements.push({
        id: `m${mSeq++}`,
        kind: "despesa",
        description,
        category,
        amount: amount + wobble,
        date: date.format("YYYY-MM-DD"),
      });
    }
  }

  const reports = [
    {
      id: "rp1",
      type: "financeiro",
      from: today.subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
      to: today.subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
      format: "CSV",
      createdAt: ts(-1, "18:20"),
      by: "u4",
    },
    {
      id: "rp2",
      type: "produtividade",
      from: today.subtract(1, "month").startOf("month").format("YYYY-MM-DD"),
      to: today.subtract(1, "month").endOf("month").format("YYYY-MM-DD"),
      format: "PDF",
      createdAt: ts(-1, "18:24"),
      by: "u4",
    },
    {
      id: "rp3",
      type: "pacientes",
      from: d(-30),
      to: d(0),
      format: "CSV",
      createdAt: ts(-6, "11:05"),
      by: "u4",
    },
  ];


  return {
    seededOn: d(0),
    users,
    tutors,
    pets,
    appointments,
    charges,
    vaccines,
    records,
    prescriptions,
    exams,
    movements,
    reports,
    reminders: [
      {
        id: "rm1",
        petId: "p1",
        channel: "WhatsApp",
        daysBefore: 7,
        active: true,
      },
    ],
  };
}
