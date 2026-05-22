# Simulador de Vigas

Simulador de vigas para estudantes de Engenharia Civil e Mecânica. Calcula reações de apoio, diagramas de esforço cortante V(x), momento fletor M(x) e flecha elástica δ(x).

## Funcionalidades

- **Configurações de apoio**: simplesmente apoiada, balanço (engastada-livre), com balanço e contínua (Clapeyron)
- **Tipos de carga**: pontual, distribuída uniforme, distribuída trapezoidal e momento concentrado
- **Diagramas SVG**: V(x), M(x) e δ(x) com anotação de extremos
- **Resultados numéricos**: reações, momento máximo, flecha máxima, verificação de tensão
- **Interface responsiva**: layout adaptável para desktop e mobile

## Tecnologias

- [React](https://react.dev/) 19
- [Vite](https://vite.dev/) 8
- SVG puro para diagramas (sem dependências de gráficos)
- CSS vanilla com custom properties

## Como usar

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev

# Build de produção
npm run build
```

## Unidades

| Grandeza | Unidade |
|---|---|
| Comprimento | m |
| Força | kN |
| Momento | kN·m |
| Carga distribuída | kN/m |
| Módulo de elasticidade | GPa |
| Momento de inércia | cm⁴ |
| Tensão | MPa |

## Estrutura do Projeto

```
src/
├── engine/          # Motor de cálculo (JS puro)
│   ├── solver.js
│   ├── continuousBeamSolver.js
│   ├── deflection.js
│   ├── diagramData.js
│   └── validators.js
├── components/
│   ├── InputPanel/   # Painel de configuração
│   ├── BeamSchematic/ # Desenho esquemático SVG
│   ├── Diagrams/     # Diagramas V(x), M(x), δ(x)
│   ├── ResultsTable/ # Tabela de resultados
│   └── Onboarding/   # Tutorial de uso
└── utils/
    ├── constants.js
    └── unitConversion.js
```
