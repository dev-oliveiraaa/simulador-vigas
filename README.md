# Simulador de Vigas

Simulador de vigas desenvolvido para estudantes de Engenharia, com foco educacional na visualização e análise do comportamento estrutural de vigas.

O sistema calcula reações de apoio, diagramas de esforço cortante, momento fletor, flecha elástica, energia de deformação e permite análises paramétricas comparativas.

## Acesse o Projeto

O simulador está disponível online em:

[simulador-vigas.vercel.app](https://simulador-vigas.vercel.app)

---

## Funcionalidades

- Configuração de diferentes tipos de apoio:
  - Viga simplesmente apoiada
  - Viga em balanço, engastada-livre
  - Viga com balanço
  - Viga contínua, utilizando o método de Clapeyron

- Aplicação de diferentes tipos de carregamento:
  - Carga pontual
  - Carga distribuída uniforme
  - Carga distribuída trapezoidal
  - Momento concentrado

- Geração de diagramas em SVG:
  - Esforço cortante `V(x)`
  - Momento fletor `M(x)`
  - Flecha elástica `δ(x)`
  - Anotação automática dos valores extremos

- Exibição de resultados numéricos:
  - Reações de apoio
  - Momento máximo
  - Flecha máxima
  - Verificação de tensão

- Análise paramétrica:
  - Varredura de variáveis, como comprimento da viga ou posição da carga
  - Comparação entre diferentes materiais, como aço e alumínio
  - Gráficos comparativos com múltiplas curvas

- Energia de deformação e Teorema de Castigliano:
  - Cálculo da energia de deformação interna acumulada
  - Determinação de deslocamentos pontuais específicos

- Interface responsiva:
  - Layout adaptável para desktop e mobile
  - Abas para alternar entre análise simples e análise paramétrica

---

## Tecnologias Utilizadas

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 8
- SVG puro para diagramas e gráficos comparativos
- CSS vanilla com custom properties
- JavaScript

---

## Instalação e Execução

Instale as dependências do projeto:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Gere a build de produção:

```bash
npm run build
```

---

## Unidades Utilizadas

| Grandeza | Unidade |
|---|---|
| Comprimento | m |
| Força | kN |
| Momento | kN·m |
| Carga distribuída | kN/m |
| Módulo de elasticidade | GPa |
| Momento de inércia | cm⁴ ou mm⁴ |
| Tensão | MPa |
| Energia de deformação | J |
| Deslocamento por Castigliano | mm |

---

## Estrutura do Projeto

```bash
src/
├── engine/                         # Motor de cálculo estrutural
│   ├── solver.js                   # Solução principal das vigas
│   ├── continuousBeamSolver.js     # Solução para vigas contínuas
│   ├── deflection.js               # Cálculo da flecha elástica
│   ├── diagramData.js              # Geração dos dados dos diagramas
│   ├── strainEnergy.js             # Energia de deformação
│   ├── parametricSweep.js          # Varredura paramétrica
│   └── validators.js               # Validação dos dados de entrada
│
├── components/
│   ├── InputPanel/                 # Painel de configuração
│   ├── BeamSchematic/              # Desenho esquemático da viga em SVG
│   ├── Diagrams/                   # Diagramas V(x), M(x) e δ(x)
│   ├── ResultsTable/               # Tabela de resultados
│   ├── ParametricAnalysis/         # Análise paramétrica
│   └── Onboarding/                 # Tutorial de uso
│
└── utils/
    ├── constants.js                # Constantes do projeto
    └── unitConversion.js           # Conversão de unidades
```

---

## Objetivo do Projeto

O projeto foi desenvolvido com finalidade educacional, buscando facilitar a compreensão visual e numérica do comportamento estrutural de vigas.

Ele pode ser utilizado como ferramenta auxiliar em disciplinas como:

- Mecânica dos Sólidos
- Mecânica das Estruturas
- Resistência dos Materiais
- Análise Estrutural

---

## Autor

Desenvolvido por **Carlos Alexandre**.
