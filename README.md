# Simulador de Vigas

Aplicação web desenvolvida para auxiliar estudantes de Engenharia na análise estrutural de vigas. O sistema calcula reações de apoio, diagramas de esforço cortante **V(x)**, momento fletor **M(x)** e flecha elástica **δ(x)** de forma visual e interativa.

## Demonstração

🌐 Acesse o projeto:  
https://simulador-vigas.vercel.app/

---

## Funcionalidades

### Modelos de Viga
- Viga simplesmente apoiada
- Viga em balanço (engastada-livre)
- Viga com balanço
- Viga contínua (Método de Clapeyron)

### Tipos de Carregamento
- Carga pontual
- Carga distribuída uniforme
- Carga distribuída trapezoidal
- Momento concentrado

### Análises Geradas
- Reações de apoio
- Diagrama de esforço cortante **V(x)**
- Diagrama de momento fletor **M(x)**
- Diagrama de flecha elástica **δ(x)**
- Identificação automática de valores máximos e mínimos
- Verificação de tensão

### Interface
- Layout responsivo para desktop e mobile
- Diagramas renderizados em SVG puro
- Interface intuitiva para configuração das vigas

---

## Tecnologias Utilizadas

- ⚛️ React 19
- ⚡ Vite 8
- 🖼️ SVG puro para renderização dos diagramas
- 🎨 CSS Vanilla com Custom Properties

---

## Instalação e Execução

Clone o repositório:

```bash
git clone https://github.com/dev-oliveiraaa/simulador-vigas.git
```

Acesse a pasta do projeto:

```bash
cd simulador-vigas
```

Instale as dependências:

```bash
npm install
```

Inicie o servidor de desenvolvimento:

```bash
npm run dev
```

Para gerar a build de produção:

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
| Módulo de Elasticidade | GPa |
| Momento de Inércia | cm⁴ |
| Tensão | MPa |

---

## Estrutura do Projeto

```bash
src/
├── engine/                    # Motor de cálculo estrutural
│   ├── solver.js
│   ├── continuousBeamSolver.js
│   ├── deflection.js
│   ├── diagramData.js
│   └── validators.js
│
├── components/
│   ├── InputPanel/            # Painel de configuração
│   ├── BeamSchematic/         # Esquema SVG da viga
│   ├── Diagrams/              # Diagramas V(x), M(x) e δ(x)
│   ├── ResultsTable/          # Resultados numéricos
│   └── Onboarding/            # Tutorial inicial
│
└── utils/
    ├── constants.js
    └── unitConversion.js
```

---

## Objetivo do Projeto

O projeto foi desenvolvido com foco educacional, buscando facilitar a visualização e compreensão do comportamento estrutural de vigas em disciplinas como:

- Mecânica dos Sólidos
- Mecânica das Estruturas
- Análise Estrutural

---

## Autor

Desenvolvido por Carlos Alexandre.
