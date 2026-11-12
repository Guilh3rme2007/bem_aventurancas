export interface PhaseDefinition {
    id: string;
    title: string;
    character: string;
    verse: string;
    description: string;
    route: string;
    order: number;
    sceneKey: string | null;
    implemented: boolean;
    available: boolean;
}

export const PHASES: readonly PhaseDefinition[] = [
    {
       id: "humildes-espirito",
       title: "Pobres de espírito",
       character: "Publicano",
       verse: "Mateus 5:3",
       description: "Humildade de espírito, reconhecendo a necessidade de Deus e a dependência d'Ele.",
       route: "/fase/humildes-espirito",
       sceneKey: "HumildesEspiritoScene",
       order: 1,
       implemented: true,
       available: true
    },
    {
       id: "os-que-choram",
       title: "Os que choram",
       character: "Neemias",
       verse: "Mateus 5:4",
       description: "Arrependimento e tristeza pelos pecados, buscando a misericórdia de Deus.",
       route: "/fase/os-que-choram",
       sceneKey: null,
       order: 2,
       implemented: false,
       available: false
    },
    {
       id: "mansos",
       title: "Os mansos",
       character: "Moisés",
       verse: "Mateus 5:5",
       description: "Submissão e mansidão, confiando em Deus e não retaliando.",
       route: "/fase/mansos",
       sceneKey: null,
       order: 3,
       implemented: false,
       available: false
    },
    {
       id: "fome-sede-justica",
       title: "Os que têm fome e sede de justiça",
       character: "Daniel",
       verse: "Mateus 5:6",
       description: "Desejo intenso de viver de acordo com a vontade de Deus e buscar a justiça.",
       route: "/fase/fome-e-sede-de-justica",
       sceneKey: null,
       order: 4,
       implemented: false,
       available: false
    },
    {
       id: "misericordiosos",
       title: "Os misericordiosos",
       character: "José do Egito",
       verse: "Mateus 5:7",
       description: "Demonstrar compaixão e perdão aos outros, refletindo o caráter de Deus.",
       route: "/fase/misericordiosos",
       sceneKey: null,
       order: 5,
       implemented: false,
       available: false
    },
     {
       id: "limpos-de-coracao",
       title: "Os puros de coração",
       character: "Natanael",
       verse: "Mateus 5:8",
       description: "Purificação do coração, buscando a integridade e a sinceridade diante de Deus.",
       route: "/fase/puros-de-coracao",
       sceneKey: null,
       order: 6,
       implemented: false,
       available: false
    },
    {
       id: "pacificadores",
       title: "Os pacificadores",
       character: "Abigail",
       verse: "Mateus 5:9",
       description: "Promover a paz e a harmonia, refletindo o caráter de Deus.",
       route: "/fase/pacificadores",
       sceneKey: null,
       order: 7,
       implemented: false,
       available: false
    },
    {
       id: "sofredores-por-causa-da-justica",
       title: "Os perseguidos por causa da justiça",
       character: "Apóstolo Paulo",
       verse: "Mateus 5:10",
       description: "Sofrer perseguição por viver de acordo com a vontade de Deus, mantendo a fé e a integridade.",
       route: "/fase/perseguidos-por-causa-da-justica",
       sceneKey: null,
       order: 8,
       implemented: false,
       available: false
    },
    {
       id: "perseguidos-por-causa-de-cristo",
       title: "Os insultados e perseguidos por causa de Cristo",
       character: "Estevão",
       verse: "Mateus 5:11-12",
       description: "Ser alvo de insultos e perseguições por seguir a Cristo, permanecendo firme na fé.",
       route: "/fase/perseguidos-por-causa-de-cristo",
       sceneKey: null,
       order: 9,
       implemented: false,
       available: false
    }
];